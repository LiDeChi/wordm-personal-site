const API_ORIGIN = 'https://api.cloudflare.com/client/v4'
const ZONE_NAME = 'wordm.us'
const HOSTNAME = 'wanjuan.wordm.us'
const TARGET = 'wanjuan.pages.dev'

const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN

if (!token) {
  throw new Error('Missing CLOUDFLARE_API_TOKEN.')
}

async function cloudflare(path, init = {}) {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const payload = await response.json()
  if (!response.ok || payload.success === false) {
    const messages = (payload.errors || [])
      .map((error) => error.message)
      .filter(Boolean)
      .join('; ')
    throw new Error(messages || `Cloudflare request failed with HTTP ${response.status}.`)
  }
  return payload
}

const zones = await cloudflare(`/zones?name=${encodeURIComponent(ZONE_NAME)}&status=active`)
const zone = zones.result?.find((candidate) => candidate.name === ZONE_NAME)

if (!zone?.id) {
  throw new Error(`Active Cloudflare zone ${ZONE_NAME} was not found.`)
}

const records = await cloudflare(
  `/zones/${zone.id}/dns_records?type=CNAME&name=${encodeURIComponent(HOSTNAME)}`,
)
const existing = records.result?.[0]
const desired = {
  type: 'CNAME',
  name: HOSTNAME,
  content: TARGET,
  proxied: true,
  ttl: 1,
  comment: 'WanJuan Cloudflare Pages production domain',
}

if (!existing) {
  await cloudflare(`/zones/${zone.id}/dns_records`, {
    method: 'POST',
    body: JSON.stringify(desired),
  })
  console.log(`Created ${HOSTNAME} -> ${TARGET}.`)
} else if (
  existing.content !== TARGET ||
  existing.proxied !== true ||
  existing.type !== 'CNAME'
) {
  await cloudflare(`/zones/${zone.id}/dns_records/${existing.id}`, {
    method: 'PUT',
    body: JSON.stringify(desired),
  })
  console.log(`Updated ${HOSTNAME} -> ${TARGET}.`)
} else {
  console.log(`${HOSTNAME} already points to ${TARGET}.`)
}
