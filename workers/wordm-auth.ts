type Env = {
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
  WORDM_PARENT_DOMAIN?: string
  AUTH_PUBLIC_ORIGIN?: string
  DEFAULT_RETURN_TO?: string
  ALLOWED_RETURN_TO?: string
  COOKIE_PREFIX?: string
}

type SupabaseTokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: SupabaseUser
}

type SupabaseUser = {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    full_name?: string
    avatar_url?: string
  }
}

const DEFAULT_PARENT_DOMAIN = 'wordm.us'
const DEFAULT_AUTH_ORIGIN = 'https://auth.wordm.us'
const DEFAULT_RETURN_TO = 'https://wordm.us/'
const DEFAULT_COOKIE_PREFIX = 'wordm_auth'
const OAUTH_STATE_COOKIE = 'wordm_oauth_state'
const PKCE_VERIFIER_COOKIE = 'wordm_pkce_verifier'
const RETURN_TO_COOKIE = 'wordm_return_to'
const PKCE_COOKIE_MAX_AGE = 10 * 60

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env)
  },
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const config = getConfig(env)

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request, config),
    })
  }

  try {
    if (url.pathname === '/' || url.pathname === '/health') {
      return json({ ok: true, service: 'wordm-auth', parentDomain: config.parentDomain }, request, config)
    }

    if (url.pathname === '/login' && request.method === 'GET') {
      return startOAuthLogin(request, config)
    }

    if (url.pathname === '/callback' && request.method === 'GET') {
      return finishOAuthCallback(request, config)
    }

    if (url.pathname === '/session' && request.method === 'GET') {
      return readSession(request, config)
    }

    if (url.pathname === '/refresh' && request.method === 'POST') {
      return refreshSession(request, config)
    }

    if (url.pathname === '/logout' && (request.method === 'POST' || request.method === 'GET')) {
      return logout(request, config)
    }

    return json({ error: 'not_found' }, request, config, 404)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    return json({ error: 'auth_service_error', message }, request, config, 500)
  }
}

type Config = {
  supabaseUrl: string
  supabaseKey: string
  parentDomain: string
  authOrigin: string
  defaultReturnTo: string
  allowedReturnTo: string[]
  cookiePrefix: string
  secureCookies: boolean
}

function getConfig(env: Env): Config {
  const parentDomain = normalizeDomain(env.WORDM_PARENT_DOMAIN ?? DEFAULT_PARENT_DOMAIN)
  const authOrigin = stripTrailingSlash(env.AUTH_PUBLIC_ORIGIN ?? DEFAULT_AUTH_ORIGIN)
  const defaultReturnTo = env.DEFAULT_RETURN_TO ?? DEFAULT_RETURN_TO

  assertEnv('SUPABASE_URL', env.SUPABASE_URL)
  assertEnv('SUPABASE_PUBLISHABLE_KEY', env.SUPABASE_PUBLISHABLE_KEY)

  return {
    supabaseUrl: stripTrailingSlash(env.SUPABASE_URL),
    supabaseKey: env.SUPABASE_PUBLISHABLE_KEY,
    parentDomain,
    authOrigin,
    defaultReturnTo,
    allowedReturnTo: parseAllowedReturnTo(env.ALLOWED_RETURN_TO, parentDomain, defaultReturnTo),
    cookiePrefix: env.COOKIE_PREFIX ?? DEFAULT_COOKIE_PREFIX,
    secureCookies: authOrigin.startsWith('https://'),
  }
}

function assertEnv(name: string, value: string | undefined): asserts value is string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
}

async function startOAuthLogin(request: Request, config: Config): Promise<Response> {
  const url = new URL(request.url)
  const provider = url.searchParams.get('provider') ?? 'google'
  const requestedReturnTo = url.searchParams.get('returnTo') ?? config.defaultReturnTo
  const returnTo = safeReturnTo(requestedReturnTo, config)
  const state = randomUrlToken()
  const verifier = randomUrlToken(64)
  const challenge = await pkceChallenge(verifier)
  const redirectTo = `${config.authOrigin}/callback`

  const authUrl = new URL(`${config.supabaseUrl}/auth/v1/authorize`)
  authUrl.searchParams.set('provider', provider)
  authUrl.searchParams.set('redirect_to', redirectTo)
  authUrl.searchParams.set('code_challenge', challenge)
  authUrl.searchParams.set('code_challenge_method', 's256')
  authUrl.searchParams.set('state', state)

  const headers = new Headers({ Location: authUrl.toString() })
  headers.append(
    'Set-Cookie',
    serializeCookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: 'Lax',
      path: '/callback',
      maxAge: PKCE_COOKIE_MAX_AGE,
    }),
  )
  headers.append(
    'Set-Cookie',
    serializeCookie(PKCE_VERIFIER_COOKIE, verifier, {
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: 'Lax',
      path: '/callback',
      maxAge: PKCE_COOKIE_MAX_AGE,
    }),
  )
  headers.append(
    'Set-Cookie',
    serializeCookie(RETURN_TO_COOKIE, returnTo, {
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: 'Lax',
      path: '/callback',
      maxAge: PKCE_COOKIE_MAX_AGE,
    }),
  )

  return new Response(null, { status: 302, headers })
}

async function finishOAuthCallback(request: Request, config: Config): Promise<Response> {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const returnedState = url.searchParams.get('state')
  const cookies = parseCookies(request.headers.get('Cookie'))
  const expectedState = cookies.get(OAUTH_STATE_COOKIE)
  const verifier = cookies.get(PKCE_VERIFIER_COOKIE)
  const returnTo = safeReturnTo(cookies.get(RETURN_TO_COOKIE) ?? config.defaultReturnTo, config)

  if (!code || !returnedState || !expectedState || returnedState !== expectedState || !verifier) {
    return redirectWithClearedTransientCookies(`${returnTo}?auth=failed`, config)
  }

  const token = await supabaseToken(config, 'pkce', {
    auth_code: code,
    code_verifier: verifier,
  })

  const headers = new Headers({ Location: returnTo })
  appendSessionCookies(headers, token, config)
  appendTransientCookieDeletes(headers, config)

  return new Response(null, { status: 302, headers })
}

async function readSession(request: Request, config: Config): Promise<Response> {
  const cookies = parseCookies(request.headers.get('Cookie'))
  const accessToken = cookies.get(accessCookieName(config))

  if (!accessToken) {
    return json({ status: 'anonymous', user: null }, request, config)
  }

  const userResponse = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    headers: supabaseHeaders(config, accessToken),
  })

  if (userResponse.status === 401) {
    return json({ status: 'expired', user: null }, request, config, 401)
  }

  if (!userResponse.ok) {
    return json({ status: 'unavailable', user: null }, request, config, 502)
  }

  const user = (await userResponse.json()) as SupabaseUser
  return json({ status: 'authenticated', user: publicUser(user) }, request, config)
}

async function refreshSession(request: Request, config: Config): Promise<Response> {
  const cookies = parseCookies(request.headers.get('Cookie'))
  const refreshToken = cookies.get(refreshCookieName(config))

  if (!refreshToken) {
    return json({ status: 'anonymous', user: null }, request, config, 401)
  }

  const token = await supabaseToken(config, 'refresh_token', { refresh_token: refreshToken })
  const headers = new Headers(corsHeaders(request, config))
  headers.set('Content-Type', 'application/json')
  appendSessionCookies(headers, token, config)

  return new Response(JSON.stringify({ status: 'authenticated', user: publicUser(token.user) }), {
    status: 200,
    headers,
  })
}

async function logout(request: Request, config: Config): Promise<Response> {
  const cookies = parseCookies(request.headers.get('Cookie'))
  const accessToken = cookies.get(accessCookieName(config))
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get('returnTo') ?? config.defaultReturnTo, config)

  if (accessToken) {
    await fetch(`${config.supabaseUrl}/auth/v1/logout`, {
      method: 'POST',
      headers: supabaseHeaders(config, accessToken),
    }).catch(() => undefined)
  }

  const headers = request.method === 'GET'
    ? new Headers({ Location: returnTo })
    : new Headers(corsHeaders(request, config))

  clearSessionCookies(headers, config)

  if (request.method === 'GET') {
    return new Response(null, { status: 302, headers })
  }

  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify({ status: 'anonymous', user: null }), { status: 200, headers })
}

async function supabaseToken(
  config: Config,
  grantType: 'pkce' | 'refresh_token',
  body: Record<string, string>,
): Promise<SupabaseTokenResponse> {
  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=${grantType}`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Supabase token exchange failed: ${response.status}`)
  }

  return response.json() as Promise<SupabaseTokenResponse>
}

function supabaseHeaders(config: Config, accessToken: string): HeadersInit {
  return {
    apikey: config.supabaseKey,
    Authorization: `Bearer ${accessToken}`,
  }
}

function appendSessionCookies(headers: Headers, token: SupabaseTokenResponse, config: Config): void {
  headers.append(
    'Set-Cookie',
    serializeCookie(accessCookieName(config), token.access_token, {
      domain: config.parentDomain,
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: 'Lax',
      path: '/',
      maxAge: Math.max(token.expires_in - 30, 60),
    }),
  )
  headers.append(
    'Set-Cookie',
    serializeCookie(refreshCookieName(config), token.refresh_token, {
      domain: config.parentDomain,
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    }),
  )
}

function clearSessionCookies(headers: Headers, config: Config): void {
  for (const name of [accessCookieName(config), refreshCookieName(config)]) {
    headers.append(
      'Set-Cookie',
      serializeCookie(name, '', {
        domain: config.parentDomain,
        httpOnly: true,
        secure: config.secureCookies,
        sameSite: 'Lax',
        path: '/',
        maxAge: 0,
      }),
    )
  }
}

function redirectWithClearedTransientCookies(location: string, config: Config): Response {
  const headers = new Headers({ Location: location })
  appendTransientCookieDeletes(headers, config)
  return new Response(null, { status: 302, headers })
}

function appendTransientCookieDeletes(headers: Headers, config: Config): void {
  for (const name of [OAUTH_STATE_COOKIE, PKCE_VERIFIER_COOKIE, RETURN_TO_COOKIE]) {
    headers.append(
      'Set-Cookie',
      serializeCookie(name, '', {
        httpOnly: true,
        secure: config.secureCookies,
        sameSite: 'Lax',
        path: '/callback',
        maxAge: 0,
      }),
    )
  }
}

function accessCookieName(config: Config): string {
  return `${config.cookiePrefix}_access`
}

function refreshCookieName(config: Config): string {
  return `${config.cookiePrefix}_refresh`
}

function publicUser(user: SupabaseUser) {
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Wordm user',
    avatarUrl: user.user_metadata?.avatar_url,
  }
}

function json(body: unknown, request: Request, config: Config, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request, config),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

function corsHeaders(request: Request, config: Config): HeadersInit {
  const origin = request.headers.get('Origin')
  const fallbackOrigin = new URL(config.defaultReturnTo).origin
  const allowedOrigin = origin && isAllowedReturnTo(origin, config) ? origin : fallbackOrigin

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

function safeReturnTo(value: string, config: Config): string {
  return isAllowedReturnTo(value, config) ? value : config.defaultReturnTo
}

function isAllowedReturnTo(value: string, config: Config): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      return false
    }

    return config.allowedReturnTo.some((allowed) => {
      const allowedUrl = new URL(allowed)
      return url.origin === allowedUrl.origin || url.hostname === config.parentDomain || url.hostname.endsWith(`.${config.parentDomain}`)
    })
  } catch {
    return false
  }
}

function parseAllowedReturnTo(value: string | undefined, parentDomain: string, defaultReturnTo: string): string[] {
  const configured = value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) ?? []

  return Array.from(
    new Set([
      defaultReturnTo,
      `https://${parentDomain}`,
      `https://auth.${parentDomain}`,
      `https://flipook.${parentDomain}`,
      `https://gridnote.${parentDomain}`,
      `https://inote.${parentDomain}`,
      `https://latti.${parentDomain}`,
      `https://read.${parentDomain}`,
      `https://studio.${parentDomain}`,
      ...configured,
    ]),
  )
}

function parseCookies(header: string | null): Map<string, string> {
  const cookies = new Map<string, string>()
  if (!header) return cookies

  for (const part of header.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=')
    if (!rawName) continue
    cookies.set(rawName, decodeURIComponent(rawValue.join('=')))
  }

  return cookies
}

type CookieOptions = {
  domain?: string
  path?: string
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'Lax' | 'Strict' | 'None'
  maxAge?: number
}

function serializeCookie(name: string, value: string, options: CookieOptions): string {
  const parts = [`${name}=${encodeURIComponent(value)}`]

  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`)
  if (options.domain) parts.push(`Domain=${options.domain}`)
  if (options.path) parts.push(`Path=${options.path}`)
  if (options.httpOnly) parts.push('HttpOnly')
  if (options.secure) parts.push('Secure')
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`)

  return parts.join('; ')
}

function normalizeDomain(value: string): string {
  return value.trim().replace(/^https?:\/\//, '').replace(/^\./, '').replace(/\/$/, '')
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, '')
}

function randomUrlToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return base64Url(bytes)
}

async function pkceChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64Url(new Uint8Array(digest))
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
