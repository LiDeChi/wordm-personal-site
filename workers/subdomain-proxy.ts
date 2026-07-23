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

const STATIC_SUBDOMAINS = new Set(['resume', 'cv', 'admin', 'eye-translation', 'support'])
const DIRECT_APP_SUBDOMAINS = new Set(['eye-translation', 'p-eye-translation'])
// These subdomains are served by standalone Pages/Workers projects and should not be intercepted.
const PASS_THROUGH_SUBDOMAINS = new Set([
  'agent',
  'arc3',
  'auth',
  'flipook',
  'flipook-updates',
  'foundry',
  'gridnote',
  'inote',
  'latti',
  'ringbook',
  'supportdualpart',
  'system',
  'wifenglish',
])

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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      case "'":
        return '&#39;'
      default:
        return char
    }
  })
}

function supportResponse(request: Request): Response {
  const url = new URL(request.url)
  const appName = url.searchParams.get('app') || url.searchParams.get('product') || 'WordM apps'
  const safeAppName = escapeHtml(appName)
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>WordM Support</title>
  <style>
    :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f7f5f0; color: #171717; }
    main { width: min(720px, calc(100vw - 40px)); padding: 56px 0; }
    p { font-size: 17px; line-height: 1.7; color: #4b4b4b; }
    h1 { margin: 0 0 18px; font-size: clamp(34px, 7vw, 72px); line-height: .95; letter-spacing: 0; }
    a { color: inherit; font-weight: 700; text-underline-offset: 4px; }
    .kicker { margin: 0 0 18px; font-size: 13px; text-transform: uppercase; letter-spacing: .14em; color: #76716a; }
    .actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 32px; }
    .button { border: 1px solid #171717; padding: 11px 15px; text-decoration: none; }
    @media (prefers-color-scheme: dark) {
      body { background: #121212; color: #f2f0ec; }
      p { color: #c9c4bc; }
      .kicker { color: #9f988d; }
      .button { border-color: #f2f0ec; }
    }
  </style>
</head>
<body>
  <main>
    <p class="kicker">WordM Support</p>
    <h1>Support for ${safeAppName}</h1>
    <p>This is the shared support entry for WordM apps. For app store listings, product pages, billing questions, account help, or bug reports, use this URL and include the app name when possible.</p>
    <p>Contact: <a href="mailto:parsonjian@gmail.com?subject=WordM%20Support%20-%20${encodeURIComponent(appName)}">parsonjian@gmail.com</a></p>
    <div class="actions">
      <a class="button" href="https://wordm.us/">WordM home</a>
      <a class="button" href="mailto:parsonjian@gmail.com?subject=WordM%20Support%20-%20${encodeURIComponent(appName)}">Email support</a>
    </div>
  </main>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  })
}

export default {
  async fetch(request: Request): Promise<Response> {
    const incomingUrl = new URL(request.url)
    const subdomain = extractSubdomain(incomingUrl.hostname)

    if (!subdomain || !isAllowedSubdomain(subdomain)) {
      // Subdomains managed by standalone Cloudflare projects should pass through untouched.
      if (subdomain && PASS_THROUGH_SUBDOMAINS.has(subdomain)) {
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

    if (subdomain === 'support') {
      return supportResponse(request)
    }

    const targetPath =
      DIRECT_APP_SUBDOMAINS.has(subdomain)
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
