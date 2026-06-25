const ROOT_ORIGIN = 'https://wordm.us'
const ADMIN_SUPABASE_API_ORIGIN = 'https://uswackifoqjxfitesflz.supabase.co'


const ADMIN_USERNAME = 'parson'
const ADMIN_PASSWORD = '050966jzl'

function unauthorizedAdminResponse() {
  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'www-authenticate': 'Basic realm="wordm-admin", charset="UTF-8"',
    },
  })
}

function parseBasicAuth(value: string | null): { username: string; password: string } | null {
  if (!value || !value.startsWith('Basic ')) {
    return null
  }

  try {
    const decoded = atob(value.slice(6))
    const separatorIndex = decoded.indexOf(':')
    if (separatorIndex < 0) {
      return null
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    }
  } catch {
    return null
  }
}


function proxyAdminApi(request: Request): Promise<Response> {
  const targetUrl = new URL('/functions/v1/admin-share-links', ADMIN_SUPABASE_API_ORIGIN)
  const headers = new Headers(request.headers)
  const authorization = request.headers.get('authorization')
  if (authorization) {
    headers.set('x-admin-basic-auth', authorization)
  }
  headers.delete('host')
  return fetch(new Request(targetUrl.toString(), {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'follow',
  }))
}

function isAdminAuthorized(request: Request) {
  const parsed = parseBasicAuth(request.headers.get('authorization'))
  if (!parsed) {
    return false
  }

  return parsed.username === ADMIN_USERNAME && parsed.password === ADMIN_PASSWORD
}

const STATIC_SUBDOMAINS = new Set(['resume', 'cv', 'admin', 'eye-translation', 'oneagent'])
const DIRECT_APP_SUBDOMAINS = new Set(['eye-translation', 'p-eye-translation'])
// These subdomains are served by their own Cloudflare Pages projects and should not be intercepted.
const PAGES_SUBDOMAINS = new Set(['agent', 'inote', 'gridnote', 'latti'])

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
      // Subdomains managed by standalone Cloudflare Pages projects should pass through untouched.
      if (subdomain && PAGES_SUBDOMAINS.has(subdomain)) {
        return fetch(request)
      }
      return new Response('Subdomain is not configured.', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      })
    }

    if (subdomain === 'admin' && !isAdminAuthorized(request)) {
      return unauthorizedAdminResponse()
    }

    if (subdomain === 'admin' && incomingUrl.pathname.startsWith('/__admin_api/')) {
      return proxyAdminApi(request)
    }

    const targetPath =
      subdomain === 'oneagent' && (incomingUrl.pathname === '/' || incomingUrl.pathname === '/oneagent')
        ? '/oneagent/'
        : DIRECT_APP_SUBDOMAINS.has(subdomain)
          ? `/eye-translation${incomingUrl.pathname === '/' ? '/' : incomingUrl.pathname}`
          : incomingUrl.pathname
    const targetUrl = new URL(`${targetPath}${incomingUrl.search}`, ROOT_ORIGIN)
    if (incomingUrl.pathname === '/') {
      if (subdomain === 'resume' || subdomain === 'cv') {
        targetUrl.searchParams.set('page', 'resume')
      } else if (subdomain === 'admin') {
        targetUrl.searchParams.set('page', 'admin')
      } else {
        targetUrl.searchParams.set('subdomain', subdomain)
      }
    }

    const proxiedRequest = new Request(targetUrl.toString(), request)
    return fetch(proxiedRequest)
  },
}
