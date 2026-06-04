import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const rootDir = path.resolve(import.meta.dirname, '..')
const snapshotPath = path.join(rootDir, 'src/data/projects.snapshot.json')
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '794b63fe0f5c7cccb9968718bb16ed39'
const workerName = process.env.WORKER_NAME || process.env.CF_WORKER_NAME || 'wordm-project-subdomains'
const retentionMode = (process.env.DEPLOY_SUBDOMAIN_RETENTION_MODE || 'current').trim().toLowerCase()

function readWranglerOAuthToken() {
  const configPath = path.join(os.homedir(), 'Library/Preferences/.wrangler/config/default.toml')
  const configText = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : ''
  return configText.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1] || null
}

function refreshWranglerOAuthToken() {
  spawnSync('npx', ['wrangler', 'whoami'], {
    cwd: rootDir,
    stdio: 'ignore',
  })
  return readWranglerOAuthToken()
}

function readSnapshotDomains() {
  const payload = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
  const domains = new Set(['resume.wordm.us', 'cv.wordm.us', 'admin.wordm.us', 'oneagent.wordm.us'])

  for (const project of payload.projects || []) {
    const subdomain = typeof project.subdomain === 'string' ? project.subdomain.trim() : ''
    if (subdomain) domains.add(`${subdomain}.wordm.us`)
  }

  return domains
}

function normalizeProductionUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return null
  }

  try {
    return new URL(rawUrl).toString()
  } catch {
    return rawUrl.trim()
  }
}

function readRetentionDomains(mode) {
  const payload = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
  const domains = new Set(['resume.wordm.us', 'cv.wordm.us', 'admin.wordm.us', 'oneagent.wordm.us'])
  const projects = Array.isArray(payload.projects) ? payload.projects : []

  for (const project of projects) {
    const subdomain = typeof project.subdomain === 'string' ? project.subdomain.trim() : ''
    if (!subdomain) {
      continue
    }

    const activityScore = Number(project.activityScore || 0)
    const tags = Array.isArray(project.tags) ? project.tags : []
    const hasDirectExperience = Boolean(normalizeProductionUrl(project.productionUrl))
    const isHighPriority = activityScore >= 75 || tags.includes('ready')

    if (mode === 'direct' && hasDirectExperience) {
      domains.add(`${subdomain}.wordm.us`)
      continue
    }

    if (mode === 'priority' && isHighPriority) {
      domains.add(`${subdomain}.wordm.us`)
      continue
    }
  }

  return domains
}

async function readCurrentCloudflareDomains() {
  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || refreshWranglerOAuthToken()
  if (!token) {
    throw new Error('Missing Cloudflare token. Run `npx wrangler login` or set CLOUDFLARE_API_TOKEN.')
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}/domains/records?per_page=100&page=1`
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
  })
  const payload = await response.json()

  if (!response.ok || payload.success === false) {
    throw new Error(JSON.stringify({ status: response.status, errors: payload.errors }, null, 2))
  }

  const records = Array.isArray(payload.result) ? payload.result : []
  return new Set(records.map((record) => record.hostname).filter(Boolean))
}

function addExtraDomains(domains) {
  for (const raw of (process.env.DEPLOY_SUBDOMAIN_EXTRA_DOMAINS || '').split(',')) {
    const domain = raw.trim()
    if (domain) domains.add(domain)
  }
}

async function main() {
  let domains

  if (process.env.DEPLOY_SUBDOMAIN_FROM_SNAPSHOT === '1') {
    domains = readSnapshotDomains()
  } else if (retentionMode === 'direct' || retentionMode === 'priority') {
    domains = readRetentionDomains(retentionMode)
  } else {
    domains = await readCurrentCloudflareDomains()
  }

  addExtraDomains(domains)

  for (const domain of [...domains].sort((a, b) => a.localeCompare(b))) {
    console.log(domain)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
