const ROOT_ORIGIN = 'https://wordm.us'

const ALLOWED_SUBDOMAINS = new Set([
  'resume',
  'cv',
  'p-page-glance-extension',
  'p-apple-notes-webclipper',
  'p-personalinflationbasket',
  'p-llm-layer',
  'p-focusor',
  'p-code-agent-demo',
  'p-open-deep-research',
  'p-dynamic-delegate-2',
])

function extractSubdomain(hostname: string): string | null {
  const normalized = hostname.toLowerCase()
  if (!normalized.endsWith('.wordm.us')) {
    return null
  }

  const subdomain = normalized.replace(/\.wordm\.us$/, '')
  if (!subdomain || subdomain === 'www') {
    return null
  }

  return subdomain
}

export default {
  async fetch(request: Request): Promise<Response> {
    const incomingUrl = new URL(request.url)
    const subdomain = extractSubdomain(incomingUrl.hostname)

    if (!subdomain || !ALLOWED_SUBDOMAINS.has(subdomain)) {
      return new Response('Subdomain is not configured.', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      })
    }

    const targetUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, ROOT_ORIGIN)
    if (incomingUrl.pathname === '/') {
      if (subdomain === 'resume' || subdomain === 'cv') {
        targetUrl.searchParams.set('page', 'resume')
      } else {
        targetUrl.searchParams.set('subdomain', subdomain)
      }
    }

    const proxiedRequest = new Request(targetUrl.toString(), request)
    return fetch(proxiedRequest)
  },
}
