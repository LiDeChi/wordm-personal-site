import { getSupabaseClient, isAuthConfigured, type AuthConfig, type AuthRole } from './auth'

export type SiteAnalyticsEventType =
  | 'page_view'
  | 'click'
  | 'download'
  | 'engagement'
  | 'signup'
  | 'login'
  | 'logout'

export type SiteAnalyticsRecord = {
  id: string
  createdAt: string
  eventType: SiteAnalyticsEventType
  sessionId: string
  userId: string | null
  userRole: AuthRole | null
  path: string
  search: string | null
  pageTitle: string | null
  referrer: string | null
  language: string | null
  viewportWidth: number | null
  viewportHeight: number | null
  durationMs: number | null
  elementTag: string | null
  elementLabel: string | null
  elementHref: string | null
  downloadUrl: string | null
  downloadName: string | null
  metadata: Record<string, unknown>
  userAgent: string | null
  ipHash: string | null
}

export type TrackSiteAnalyticsInput = {
  eventType: SiteAnalyticsEventType
  userRole?: AuthRole
  durationMs?: number | null
  elementTag?: string | null
  elementLabel?: string | null
  elementHref?: string | null
  downloadUrl?: string | null
  downloadName?: string | null
  metadata?: Record<string, unknown>
  flush?: boolean
}

const ANALYTICS_SESSION_KEY = 'wordm-analytics-session-v1'
const ANALYTICS_DISABLED_KEY = 'wordm-analytics-disabled-v1'
const SENSITIVE_QUERY_KEYS = new Set([
  'access_token',
  'auth_token',
  'code',
  'error',
  'error_code',
  'error_description',
  'provider_refresh_token',
  'provider_token',
  'refresh_token',
  'share',
  'token',
])
const DOWNLOAD_EXTENSION_PATTERN = /\.(dmg|exe|msi|pkg|zip|tar|gz|pdf|csv|json|md|txt)(?:[?#]|$)/i

let cachedAuthToken: { token: string; expiresAt: number } | null = null

function hasWindow() {
  return typeof window !== 'undefined'
}

function hasDocument() {
  return typeof document !== 'undefined'
}

function clampText(value: string | null | undefined, maxLength: number) {
  if (!value) {
    return null
  }

  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized ? normalized.slice(0, maxLength) : null
}

function readLocalStorage(key: string) {
  if (!hasWindow()) {
    return null
  }

  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocalStorage(key: string, value: string) {
  if (!hasWindow()) {
    return
  }

  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Analytics should never break the product experience.
  }
}

function makeSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function getSiteAnalyticsSessionId() {
  const existing = readLocalStorage(ANALYTICS_SESSION_KEY)
  if (existing && existing.length >= 8) {
    return existing
  }

  const nextSessionId = makeSessionId()
  writeLocalStorage(ANALYTICS_SESSION_KEY, nextSessionId)
  return nextSessionId
}

export function isSiteAnalyticsEnabled(config: AuthConfig) {
  if (!hasWindow() || !isAuthConfigured(config)) {
    return false
  }

  return readLocalStorage(ANALYTICS_DISABLED_KEY) !== '1'
}

function sanitizeSearch(search: string) {
  if (!search) {
    return null
  }

  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const next = new URLSearchParams()
  for (const [key, value] of params.entries()) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
      next.set(key, '[redacted]')
    } else {
      next.set(key, value.slice(0, 160))
    }
  }

  const normalized = next.toString()
  return normalized ? `?${normalized}` : null
}

function sanitizeUrl(rawUrl: string | null | undefined) {
  const value = clampText(rawUrl, 1200)
  if (!value || !hasWindow()) {
    return null
  }

  try {
    const parsed = new URL(value, window.location.origin)
    const sanitizedSearch = sanitizeSearch(parsed.search) ?? ''
    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${sanitizedSearch}${parsed.hash ? '#hash' : ''}`.slice(0, 500)
    }

    return `${parsed.origin}${parsed.pathname}`.slice(0, 500)
  } catch {
    return value.slice(0, 500)
  }
}

function currentPageContext() {
  const path = hasWindow() ? window.location.pathname || '/' : '/'
  const search = hasWindow() ? sanitizeSearch(window.location.search) : null
  const referrer = hasDocument() ? sanitizeUrl(document.referrer) : null
  const language =
    (hasDocument() ? document.documentElement.lang : '') ||
    (typeof navigator !== 'undefined' ? navigator.language : '')

  return {
    path,
    search,
    pageTitle: hasDocument() ? clampText(document.title, 180) : null,
    referrer,
    language: clampText(language, 80),
    viewportWidth: hasWindow() ? window.innerWidth : null,
    viewportHeight: hasWindow() ? window.innerHeight : null,
  }
}

async function resolveAnalyticsToken(config: AuthConfig) {
  if (cachedAuthToken && cachedAuthToken.expiresAt > Date.now()) {
    return cachedAuthToken.token
  }

  let token = config.supabaseAnonKey
  try {
    const client = getSupabaseClient(config)
    const { data } = await client.auth.getSession()
    token = data.session?.access_token || config.supabaseAnonKey
  } catch {
    token = config.supabaseAnonKey
  }

  cachedAuthToken = {
    token,
    expiresAt: Date.now() + 30_000,
  }
  return token
}

function normalizeMetadata(metadata: Record<string, unknown> | undefined) {
  if (!metadata) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(metadata)
      .slice(0, 30)
      .map(([key, value]) => [key.slice(0, 80), value]),
  )
}

export async function trackSiteEvent(config: AuthConfig, input: TrackSiteAnalyticsInput) {
  if (!isSiteAnalyticsEnabled(config)) {
    return false
  }

  const token = await resolveAnalyticsToken(config)
  const body = JSON.stringify({
    eventType: input.eventType,
    sessionId: getSiteAnalyticsSessionId(),
    userRole: input.userRole ?? 'guest',
    ...currentPageContext(),
    durationMs: typeof input.durationMs === 'number' ? Math.max(0, Math.round(input.durationMs)) : null,
    elementTag: clampText(input.elementTag, 48),
    elementLabel: clampText(input.elementLabel, 240),
    elementHref: sanitizeUrl(input.elementHref),
    downloadUrl: sanitizeUrl(input.downloadUrl),
    downloadName: clampText(input.downloadName, 180),
    metadata: normalizeMetadata(input.metadata),
  })

  try {
    const response = await fetch(`${config.supabaseUrl.replace(/\/$/, '')}/functions/v1/site-analytics`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: config.supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body,
      keepalive: Boolean(input.flush) && body.length < 60_000,
    })
    return response.ok
  } catch {
    return false
  }
}

function normalizeAnalyticsRecord(input: Partial<SiteAnalyticsRecord>): SiteAnalyticsRecord {
  return {
    id: typeof input.id === 'string' ? input.id : '',
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : new Date(0).toISOString(),
    eventType: (typeof input.eventType === 'string' ? input.eventType : 'page_view') as SiteAnalyticsEventType,
    sessionId: typeof input.sessionId === 'string' ? input.sessionId : '',
    userId: typeof input.userId === 'string' ? input.userId : null,
    userRole: (typeof input.userRole === 'string' ? input.userRole : null) as AuthRole | null,
    path: typeof input.path === 'string' ? input.path : '/',
    search: typeof input.search === 'string' ? input.search : null,
    pageTitle: typeof input.pageTitle === 'string' ? input.pageTitle : null,
    referrer: typeof input.referrer === 'string' ? input.referrer : null,
    language: typeof input.language === 'string' ? input.language : null,
    viewportWidth: typeof input.viewportWidth === 'number' ? input.viewportWidth : null,
    viewportHeight: typeof input.viewportHeight === 'number' ? input.viewportHeight : null,
    durationMs: typeof input.durationMs === 'number' ? input.durationMs : null,
    elementTag: typeof input.elementTag === 'string' ? input.elementTag : null,
    elementLabel: typeof input.elementLabel === 'string' ? input.elementLabel : null,
    elementHref: typeof input.elementHref === 'string' ? input.elementHref : null,
    downloadUrl: typeof input.downloadUrl === 'string' ? input.downloadUrl : null,
    downloadName: typeof input.downloadName === 'string' ? input.downloadName : null,
    metadata:
      input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
        ? input.metadata
        : {},
    userAgent: typeof input.userAgent === 'string' ? input.userAgent : null,
    ipHash: typeof input.ipHash === 'string' ? input.ipHash : null,
  }
}

export async function fetchSiteAnalyticsEvents(config: AuthConfig, limit = 100) {
  const client = getSupabaseClient(config)
  const { data, error } = await client.auth.getSession()
  if (error) {
    throw error
  }

  const accessToken = data.session?.access_token
  if (!accessToken) {
    throw new Error('UNAUTHENTICATED')
  }

  const url = new URL(`${config.supabaseUrl.replace(/\/$/, '')}/functions/v1/site-analytics`)
  url.searchParams.set('limit', String(Math.max(1, Math.min(200, Math.round(limit)))))

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: config.supabaseAnonKey,
    },
  })
  const payload = (await response.json().catch(() => null)) as { events?: unknown; error?: unknown } | null

  if (!response.ok) {
    const detail = typeof payload?.error === 'string' && payload.error ? payload.error : `ANALYTICS_REQUEST_FAILED_${response.status}`
    throw new Error(detail)
  }

  const rows = payload && Array.isArray(payload.events) ? payload.events : []
  return rows.map((item) => normalizeAnalyticsRecord(item as Partial<SiteAnalyticsRecord>))
}

export function isDownloadHref(href: string | null | undefined) {
  return Boolean(href && DOWNLOAD_EXTENSION_PATTERN.test(href))
}
