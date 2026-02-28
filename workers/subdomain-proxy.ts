const ROOT_ORIGIN = 'https://wordm.us'

const STATIC_SUBDOMAINS = new Set(['resume', 'cv'])

function isAllowedSubdomain(subdomain: string): boolean {
  return STATIC_SUBDOMAINS.has(subdomain) || subdomain.startsWith('p-')
}

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

    if (!subdomain || !isAllowedSubdomain(subdomain)) {
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
