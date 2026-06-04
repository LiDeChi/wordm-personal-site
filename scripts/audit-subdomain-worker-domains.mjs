import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import tls from 'node:tls'
import dns from 'node:dns/promises'
import { spawnSync } from 'node:child_process'

const rootDir = path.resolve(import.meta.dirname, '..')
const snapshotPath = path.join(rootDir, 'src/data/projects.snapshot.json')
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '794b63fe0f5c7cccb9968718bb16ed39'
const workerName = process.env.WORKER_NAME || process.env.CF_WORKER_NAME || 'wordm-project-subdomains'
const tlsTimeoutMs = Number(process.env.AUDIT_SUBDOMAIN_TLS_TIMEOUT_MS || 5000)
const tlsSampleLimitRaw = (process.env.AUDIT_SUBDOMAIN_TLS_SAMPLE_LIMIT || '5').trim().toLowerCase()

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

function readSnapshotProjects() {
  const payload = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
  return Array.isArray(payload.projects) ? payload.projects : []
}

function getToken() {
  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || refreshWranglerOAuthToken()
  if (!token) {
    throw new Error('Missing Cloudflare token. Run `npx wrangler login` or set CLOUDFLARE_API_TOKEN.')
  }
  return token
}

async function readCurrentCloudflareDomains() {
  const token = getToken()
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}/domains/records?per_page=100&page=1`
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
  })
  const payload = await response.json()

  if (!response.ok || payload.success === false) {
    throw new Error(JSON.stringify({ status: response.status, errors: payload.errors }, null, 2))
  }

  return Array.isArray(payload.result) ? payload.result : []
}

function normalizeProductionUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return null
  }

  try {
    return new URL(rawUrl).toString()
  } catch {
    return rawUrl
  }
}

function buildSnapshotIndex(projects) {
  const bySubdomain = new Map()
  for (const project of projects) {
    const subdomain = typeof project.subdomain === 'string' ? project.subdomain.trim() : ''
    if (!subdomain) {
      continue
    }
    bySubdomain.set(`${subdomain}.wordm.us`, {
      slug: project.slug || '',
      subdomain,
      productionUrl: normalizeProductionUrl(project.productionUrl),
      subdomainUrl: normalizeProductionUrl(project.subdomainUrl),
    })
  }
  return bySubdomain
}

function buildSnapshotDomainList(projects) {
  const domains = new Set(['admin.wordm.us', 'cv.wordm.us', 'resume.wordm.us'])
  for (const project of projects) {
    const subdomain = typeof project.subdomain === 'string' ? project.subdomain.trim() : ''
    if (subdomain) {
      domains.add(`${subdomain}.wordm.us`)
    }
  }
  return [...domains].sort((a, b) => a.localeCompare(b))
}

function resolveTlsSampleLimit(total) {
  if (tlsSampleLimitRaw === 'all') {
    return total
  }

  const parsed = Number(tlsSampleLimitRaw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return Math.min(total, 5)
  }

  return Math.min(total, parsed)
}

function buildWildcardProbeHosts() {
  const nonce = Date.now().toString(36)
  return [
    `${nonce}-probe.wordm.us`,
    `${nonce}-probe.deep.wordm.us`,
  ]
}

async function resolveDns(hostname) {
  try {
    const addresses = await dns.resolve4(hostname)
    return {
      hostname,
      ok: true,
      addresses,
    }
  } catch (error) {
    return {
      hostname,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function checkHostTls(hostname) {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: hostname,
      port: 443,
      servername: hostname,
      rejectUnauthorized: false,
    })

    socket.setTimeout(tlsTimeoutMs)

    socket.on('secureConnect', () => {
      const peerCertificate = socket.getPeerCertificate(true)
      const san = typeof peerCertificate.subjectaltname === 'string'
        ? peerCertificate.subjectaltname.split(', ').map((entry) => entry.replace(/^DNS:/, ''))
        : []

      resolve({
        hostname,
        ok: true,
        subject: peerCertificate.subject?.CN || null,
        issuer: peerCertificate.issuer?.CN || null,
        san,
      })
      socket.end()
    })

    socket.on('timeout', () => {
      resolve({
        hostname,
        ok: false,
        error: `TLS timeout after ${tlsTimeoutMs}ms`,
      })
      socket.destroy()
    })

    socket.on('error', (error) => {
      resolve({
        hostname,
        ok: false,
        error: error.message,
      })
    })
  })
}

async function probeTls(hostnames) {
  const results = []
  for (const hostname of hostnames) {
    results.push(await checkHostTls(hostname))
  }
  return results
}

async function main() {
  const projects = readSnapshotProjects()
  const snapshotByDomain = buildSnapshotIndex(projects)
  const snapshotDomains = buildSnapshotDomainList(projects)
  const liveRecords = await readCurrentCloudflareDomains()
  const liveDomains = liveRecords
    .map((record) => record.hostname)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  const fixedInfraDomains = []
  const matchedProjectDomains = []
  const unmatchedLiveDomains = []
  const snapshotOnlyDomains = snapshotDomains.filter((domain) => !liveDomains.includes(domain))

  for (const domain of liveDomains) {
    const snapshotProject = snapshotByDomain.get(domain)
    if (snapshotProject) {
      matchedProjectDomains.push({
        domain,
        slug: snapshotProject.slug,
        productionUrl: snapshotProject.productionUrl,
        subdomainUrl: snapshotProject.subdomainUrl,
        hasDirectExperience: Boolean(snapshotProject.productionUrl),
      })
      continue
    }

    if (domain === 'admin.wordm.us' || domain === 'cv.wordm.us' || domain === 'resume.wordm.us') {
      fixedInfraDomains.push(domain)
      continue
    }

    unmatchedLiveDomains.push(domain)
  }

  const liveWithDirectExperience = matchedProjectDomains.filter((item) => item.hasDirectExperience)
  const livePortfolioShellOnly = matchedProjectDomains.filter((item) => !item.hasDirectExperience)
  const tlsProbeDomains = snapshotOnlyDomains.slice(0, resolveTlsSampleLimit(snapshotOnlyDomains.length))
  const wildcardProbeHosts = buildWildcardProbeHosts()
  const [liveTlsResults, snapshotOnlyTlsResults, wildcardDnsResults, wildcardTlsResults] = await Promise.all([
    probeTls(liveDomains),
    probeTls(tlsProbeDomains),
    Promise.all(wildcardProbeHosts.map((hostname) => resolveDns(hostname))),
    probeTls(wildcardProbeHosts),
  ])

  const liveTlsFailures = liveTlsResults.filter((item) => !item.ok)
  const snapshotOnlyTlsFailures = snapshotOnlyTlsResults.filter((item) => !item.ok)
  const snapshotOnlyTlsSuccesses = snapshotOnlyTlsResults.filter((item) => item.ok)
  const customDomainsCanShrinkNow = snapshotOnlyTlsResults.length > 0 && snapshotOnlyTlsFailures.length === 0
  const wildcardDnsReady = wildcardDnsResults.every((item) => item.ok)
  const wildcardTlsReady = wildcardTlsResults.every((item) => item.ok)

  const summary = {
    workerName,
    accountId,
    counts: {
      liveCustomDomains: liveDomains.length,
      fixedInfraDomains: fixedInfraDomains.length,
      liveProjectDomains: matchedProjectDomains.length,
      liveWithDirectExperience: liveWithDirectExperience.length,
      livePortfolioShellOnly: livePortfolioShellOnly.length,
      snapshotCandidateDomains: snapshotDomains.length,
      snapshotOnlyDomains: snapshotOnlyDomains.length,
      unmatchedLiveDomains: unmatchedLiveDomains.length,
    },
    liveDomains,
    fixedInfraDomains,
    liveWithDirectExperience,
    livePortfolioShellOnly,
    unmatchedLiveDomains,
    snapshotOnlyDomains,
    tlsAudit: {
      timeoutMs: tlsTimeoutMs,
      sampledSnapshotOnlyDomains: tlsProbeDomains,
      liveDomainsReadyCount: liveTlsResults.length - liveTlsFailures.length,
      liveDomainsFailedCount: liveTlsFailures.length,
      snapshotOnlyReadyCount: snapshotOnlyTlsSuccesses.length,
      snapshotOnlyFailedCount: snapshotOnlyTlsFailures.length,
      customDomainsCanShrinkNow,
      blocker:
        customDomainsCanShrinkNow
          ? null
          : 'Snapshot-only subdomains still fail TLS before the Worker route can run, so deleting current Worker custom domains would break reachability for at least some project hosts.',
      liveFailures: liveTlsFailures,
      snapshotOnlySuccesses: snapshotOnlyTlsSuccesses,
      snapshotOnlyFailures: snapshotOnlyTlsFailures,
    },
    wildcardProbe: {
      hosts: wildcardProbeHosts,
      wildcardDnsReady,
      wildcardTlsReady,
      dnsResults: wildcardDnsResults,
      tlsResults: wildcardTlsResults,
      interpretation:
        wildcardDnsReady && !wildcardTlsReady
          ? 'Wildcard-style DNS resolution exists, but TLS still fails before Worker execution. This usually means route coverage alone is not enough and certificate coverage is still missing for arbitrary subdomains.'
          : null,
    },
    migrationNote:
      'A wildcard route such as *.wordm.us/* only helps after TLS already works for the hostname. If snapshot-only hosts still fail TLS, current Worker custom domains are still carrying certificate coverage and cannot be deleted yet.',
  }

  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
