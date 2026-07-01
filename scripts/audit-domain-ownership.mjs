import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const rootDir = path.resolve(import.meta.dirname, '..')
const configPath = path.join(rootDir, 'config/domain-ownership.json')
const wranglerConfigPath = path.join(os.homedir(), 'Library/Preferences/.wrangler/config/default.toml')

function readConfig() {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'))
}

function readWranglerOAuthToken() {
  const configText = fs.existsSync(wranglerConfigPath) ? fs.readFileSync(wranglerConfigPath, 'utf8') : ''
  return configText.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1] || null
}

function refreshWranglerOAuthToken() {
  spawnSync('npx', ['wrangler', 'whoami'], {
    cwd: rootDir,
    stdio: 'ignore',
  })
  return readWranglerOAuthToken()
}

function getToken() {
  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || readWranglerOAuthToken() || refreshWranglerOAuthToken()
  if (!token) {
    throw new Error('Missing Cloudflare token. Run `npx wrangler login` or set CLOUDFLARE_API_TOKEN.')
  }
  return token
}

async function readCloudflare(url, token) {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
  })
  const payload = await response.json()

  if (!response.ok || payload.success === false) {
    throw new Error(JSON.stringify({ url, status: response.status, errors: payload.errors }, null, 2))
  }

  return payload
}

async function readAllPagesProjects(accountId, token) {
  const projects = []
  let page = 1

  while (true) {
    const payload = await readCloudflare(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects?page=${page}`, token)
    projects.push(...(payload.result || []))

    const info = payload.result_info
    if (!info || page >= info.total_pages) {
      break
    }

    page += 1
  }

  return projects
}

async function readWorkerScripts(accountId, token) {
  const payload = await readCloudflare(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts`, token)
  return payload.result || []
}

async function readWorkerCustomDomains(accountId, scriptName, token) {
  try {
    const payload = await readCloudflare(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${encodeURIComponent(scriptName)}/domains/records?per_page=100&page=1`,
      token,
    )
    return payload.result || []
  } catch {
    return []
  }
}

async function readZoneId(domain, token) {
  const payload = await readCloudflare(`https://api.cloudflare.com/client/v4/zones?name=${encodeURIComponent(domain)}&per_page=50`, token)
  const zone = (payload.result || [])[0]
  if (!zone?.id) {
    throw new Error(`Could not find Cloudflare zone for ${domain}`)
  }
  return zone.id
}

async function readWorkerRoutes(zoneId, token) {
  const payload = await readCloudflare(`https://api.cloudflare.com/client/v4/zones/${zoneId}/workers/routes?per_page=100&page=1`, token)
  return payload.result || []
}

function toMap(items, key) {
  const map = new Map()
  for (const item of items) {
    map.set(key(item), item)
  }
  return map
}

function comparePages(expected, actual) {
  const expectedByDomain = toMap(expected, (item) => item.domain)
  const actualByDomain = toMap(actual, (item) => item.domain)

  const missing = []
  const mismatched = []
  const unexpected = []

  for (const item of expected) {
    const actualItem = actualByDomain.get(item.domain)
    if (!actualItem) {
      missing.push(item)
      continue
    }

    if (actualItem.project !== item.project) {
      mismatched.push({ expected: item, actual: actualItem })
    }
  }

  for (const item of actual) {
    if (!expectedByDomain.has(item.domain)) {
      unexpected.push(item)
    }
  }

  return { missing, mismatched, unexpected }
}

function compareWorkers(expected, actual) {
  const expectedByDomain = toMap(expected, (item) => item.domain)
  const actualByDomain = toMap(actual, (item) => item.domain)

  const missing = []
  const mismatched = []
  const unexpected = []

  for (const item of expected) {
    const actualItem = actualByDomain.get(item.domain)
    if (!actualItem) {
      missing.push(item)
      continue
    }

    if (actualItem.worker !== item.worker) {
      mismatched.push({ expected: item, actual: actualItem })
    }
  }

  for (const item of actual) {
    if (!expectedByDomain.has(item.domain)) {
      unexpected.push(item)
    }
  }

  return { missing, mismatched, unexpected }
}

function compareRoutes(expected, actual) {
  const expectedByPattern = toMap(expected, (item) => item.pattern)
  const actualByPattern = toMap(actual, (item) => item.pattern)

  const missing = []
  const mismatched = []
  const unexpected = []

  for (const item of expected) {
    const actualItem = actualByPattern.get(item.pattern)
    if (!actualItem) {
      missing.push(item)
      continue
    }

    if ((actualItem.worker || null) !== (item.worker || null)) {
      mismatched.push({ expected: item, actual: actualItem })
    }
  }

  for (const item of actual) {
    if (!expectedByPattern.has(item.pattern)) {
      unexpected.push(item)
    }
  }

  return { missing, mismatched, unexpected }
}

function readProxySubdomainSet(setName) {
  const workerPath = path.join(rootDir, 'workers/subdomain-proxy.ts')
  const text = fs.readFileSync(workerPath, 'utf8')
  const match = text.match(new RegExp(`${setName}\\s*=\\s*new Set\\(\\[([\\s\\S]*?)\\]\\)`))
  if (!match) {
    return null
  }

  return [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]).sort((a, b) => a.localeCompare(b))
}

function comparePassThrough(expected) {
  const actual = readProxySubdomainSet('PASS_THROUGH_SUBDOMAINS')
  if (!actual) {
    return {
      missing: expected,
      unexpected: [],
      parseError: 'Could not find PASS_THROUGH_SUBDOMAINS in workers/subdomain-proxy.ts',
    }
  }

  return {
    missing: expected.filter((item) => !actual.includes(item)),
    unexpected: actual.filter((item) => !expected.includes(item)),
    actual,
  }
}

function compareWildcardHandled(expected) {
  const actualStatic = readProxySubdomainSet('STATIC_SUBDOMAINS')
  const actualPassThrough = readProxySubdomainSet('PASS_THROUGH_SUBDOMAINS')
  const expectedSubdomains = expected.map((item) => item.subdomain).sort((a, b) => a.localeCompare(b))

  if (!actualStatic || !actualPassThrough) {
    return {
      missing: expectedSubdomains,
      unexpected: [],
      parseError: 'Could not find STATIC_SUBDOMAINS or PASS_THROUGH_SUBDOMAINS in workers/subdomain-proxy.ts',
    }
  }

  return {
    missing: expectedSubdomains.filter((item) => !actualStatic.includes(item)),
    unexpected: actualStatic.filter((item) => expectedSubdomains.includes(item) && actualPassThrough.includes(item)),
    actual: expectedSubdomains.filter((item) => actualStatic.includes(item) && !actualPassThrough.includes(item)),
  }
}

function hasFindings(section) {
  return Boolean(
    section.missing?.length ||
    section.mismatched?.length ||
    section.unexpected?.length ||
    section.parseError,
  )
}

async function main() {
  const config = readConfig()
  const token = getToken()

  const [pagesProjects, workerScripts, zoneId] = await Promise.all([
    readAllPagesProjects(config.accountId, token),
    readWorkerScripts(config.accountId, token),
    readZoneId(config.domain, token),
  ])

  const workerDomainsNested = []
  for (const script of workerScripts) {
    const worker = script.id
    const records = await readWorkerCustomDomains(config.accountId, worker, token)
    for (const record of records) {
      if (record.hostname === config.domain || record.hostname?.endsWith(`.${config.domain}`)) {
        workerDomainsNested.push({
          domain: record.hostname,
          worker,
        })
      }
    }
  }

  const routes = await readWorkerRoutes(zoneId, token)

  const actualPages = pagesProjects
    .flatMap((project) =>
      (project.domains || [])
        .filter((domain) => domain === config.domain || domain.endsWith(`.${config.domain}`))
        .map((domain) => ({ domain, project: project.name })),
    )
    .sort((a, b) => a.domain.localeCompare(b.domain))

  const actualWorkerDomains = workerDomainsNested.sort((a, b) => a.domain.localeCompare(b.domain))
  const actualRoutes = routes
    .filter((route) => route.pattern.includes(config.domain))
    .map((route) => ({ pattern: route.pattern, worker: route.script || null }))
    .sort((a, b) => a.pattern.localeCompare(b.pattern))

  const report = {
    checkedAt: new Date().toISOString(),
    domain: config.domain,
    pages: {
      expected: config.pagesBindings.length,
      actual: actualPages.length,
      ...comparePages(config.pagesBindings, actualPages),
    },
    workerCustomDomains: {
      expected: config.workerCustomDomains.length,
      actual: actualWorkerDomains.length,
      ...compareWorkers(config.workerCustomDomains, actualWorkerDomains),
    },
    workerRoutes: {
      expected: config.workerRoutes.length,
      actual: actualRoutes.length,
      ...compareRoutes(config.workerRoutes, actualRoutes),
    },
    proxyPassThrough: comparePassThrough(config.wildcardPassThroughSubdomains || []),
    wildcardHandledSubdomains: compareWildcardHandled(config.wildcardHandledSubdomains || []),
  }

  report.ok = ![
    report.pages,
    report.workerCustomDomains,
    report.workerRoutes,
    report.proxyPassThrough,
    report.wildcardHandledSubdomains,
  ].some(hasFindings)

  console.log(JSON.stringify(report, null, 2))

  if (!report.ok && process.env.AUDIT_DOMAIN_OWNERSHIP_STRICT === '1') {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exit(1)
})
