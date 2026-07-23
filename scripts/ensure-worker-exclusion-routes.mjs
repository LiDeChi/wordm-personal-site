import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const API_ORIGIN = 'https://api.cloudflare.com/client/v4'
const rootDir = path.resolve(import.meta.dirname, '..')
const configPath = path.join(rootDir, 'config/domain-ownership.json')
const wranglerConfigPath = path.join(
  os.homedir(),
  'Library/Preferences/.wrangler/config/default.toml',
)

function readWranglerOAuthToken() {
  const text = fs.existsSync(wranglerConfigPath)
    ? fs.readFileSync(wranglerConfigPath, 'utf8')
    : ''
  return text.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1] || null
}

function getToken() {
  const configured =
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.CF_API_TOKEN ||
    readWranglerOAuthToken()
  if (configured) return configured

  spawnSync('npx', ['wrangler', 'whoami'], {
    cwd: rootDir,
    stdio: 'ignore',
  })
  const refreshed = readWranglerOAuthToken()
  if (!refreshed) {
    throw new Error(
      'Missing Cloudflare token. Run `npx wrangler login` or set CLOUDFLARE_API_TOKEN.',
    )
  }
  return refreshed
}

async function cloudflare(pathname, token, init = {}) {
  const response = await fetch(`${API_ORIGIN}${pathname}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const payload = await response.json()
  if (!response.ok || payload.success === false) {
    const message = (payload.errors || [])
      .map((error) => error.message)
      .filter(Boolean)
      .join('; ')
    throw new Error(message || `Cloudflare request failed with HTTP ${response.status}.`)
  }
  return payload
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const exclusions = (config.workerRoutes || []).filter((route) => route.worker === null)
const token = getToken()
const zonePayload = await cloudflare(
  `/zones?name=${encodeURIComponent(config.domain)}&status=active`,
  token,
)
const zone = zonePayload.result?.find((candidate) => candidate.name === config.domain)

if (!zone?.id) {
  throw new Error(`Active Cloudflare zone ${config.domain} was not found.`)
}

const routePayload = await cloudflare(`/zones/${zone.id}/workers/routes`, token)
const routesByPattern = new Map(
  (routePayload.result || []).map((route) => [route.pattern, route]),
)

for (const exclusion of exclusions) {
  const existing = routesByPattern.get(exclusion.pattern)
  const desired = { pattern: exclusion.pattern, script: null }

  if (!existing) {
    await cloudflare(`/zones/${zone.id}/workers/routes`, token, {
      method: 'POST',
      body: JSON.stringify(desired),
    })
    console.log(`Created Worker exclusion route ${exclusion.pattern}.`)
  } else if (existing.script !== null) {
    await cloudflare(`/zones/${zone.id}/workers/routes/${existing.id}`, token, {
      method: 'PUT',
      body: JSON.stringify(desired),
    })
    console.log(`Updated Worker exclusion route ${exclusion.pattern}.`)
  } else {
    console.log(`Worker exclusion route ${exclusion.pattern} is already active.`)
  }
}
