import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js'

export type AuthConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
}

export type AuthUserSummary = {
  id: string
  email: string
}

export type SignupOutcome = 'session' | 'confirm' | 'exists'

export type SignupResult = {
  outcome: SignupOutcome
  user: User | null
}

const AUTH_STORAGE_KEY = 'wordm-auth-v1'
const AUTH_COOKIE_KEY = 'wordm-auth-v1-cookie'
const AUTH_SYNC_COOKIE_KEY = 'wordm-auth-v1-sync'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const LOGOUT_SYNC_MAX_AGE_SECONDS = 60 * 5

let cachedClient:
  | {
      url: string
      anonKey: string
      client: SupabaseClient
    }
  | null = null

function hasWindow() {
  return typeof window !== 'undefined'
}

function hasDocument() {
  return typeof document !== 'undefined'
}

function isWordmHost(hostname: string) {
  const host = hostname.toLowerCase()
  return host === 'wordm.us' || host.endsWith('.wordm.us')
}

function resolveCookieDomain() {
  if (!hasWindow()) {
    return null
  }

  return isWordmHost(window.location.hostname) ? '.wordm.us' : null
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
    // Ignore storage write failures.
  }
}

function removeLocalStorage(key: string) {
  if (!hasWindow()) {
    return
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage write failures.
  }
}

function readCookie(name: string) {
  if (!hasDocument()) {
    return null
  }

  const prefix = `${name}=`
  const entries = document.cookie ? document.cookie.split('; ') : []

  for (const entry of entries) {
    if (entry.startsWith(prefix)) {
      return decodeURIComponent(entry.slice(prefix.length))
    }
  }

  return null
}

function writeCookie(name: string, value: string, maxAge = COOKIE_MAX_AGE_SECONDS) {
  if (!hasDocument()) {
    return
  }

  const cookieParts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', `Max-Age=${maxAge}`, 'SameSite=Lax']
  const domain = resolveCookieDomain()

  if (domain) {
    cookieParts.push(`Domain=${domain}`)
  }

  if (hasWindow() && window.location.protocol === 'https:') {
    cookieParts.push('Secure')
  }

  document.cookie = cookieParts.join('; ')
}

function clearCookie(name: string) {
  if (!hasDocument()) {
    return
  }

  const cookieParts = [`${name}=`, 'Path=/', 'Max-Age=0', 'SameSite=Lax']
  const domain = resolveCookieDomain()

  if (domain) {
    cookieParts.push(`Domain=${domain}`)
  }

  if (hasWindow() && window.location.protocol === 'https:') {
    cookieParts.push('Secure')
  }

  document.cookie = cookieParts.join('; ')
}

const crossSubdomainStorage = {
  getItem(key: string) {
    const cookieValue = readCookie(AUTH_COOKIE_KEY)
    const syncState = readCookie(AUTH_SYNC_COOKIE_KEY)
    const localValue = readLocalStorage(key)

    if (syncState?.startsWith('logout:')) {
      removeLocalStorage(key)
      return null
    }

    if (cookieValue) {
      if (cookieValue !== localValue) {
        writeLocalStorage(key, cookieValue)
      }
      return cookieValue
    }

    return localValue
  },

  setItem(key: string, value: string) {
    writeLocalStorage(key, value)
    writeCookie(AUTH_COOKIE_KEY, value)
    writeCookie(AUTH_SYNC_COOKIE_KEY, 'active')
  },

  removeItem(key: string) {
    removeLocalStorage(key)
    clearCookie(AUTH_COOKIE_KEY)
    writeCookie(AUTH_SYNC_COOKIE_KEY, `logout:${Date.now()}`, LOGOUT_SYNC_MAX_AGE_SECONDS)
  },
}

export function isAuthConfigured(config: AuthConfig) {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey)
}

export function getSupabaseClient(config: AuthConfig) {
  if (!isAuthConfigured(config)) {
    throw new Error('Supabase is not configured.')
  }

  if (
    cachedClient &&
    cachedClient.url === config.supabaseUrl &&
    cachedClient.anonKey === config.supabaseAnonKey
  ) {
    return cachedClient.client
  }

  const client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: AUTH_STORAGE_KEY,
      storage: crossSubdomainStorage,
    },
  })

  cachedClient = {
    url: config.supabaseUrl,
    anonKey: config.supabaseAnonKey,
    client,
  }

  return client
}

export function resolveSignupOutcome(input: { user: User | null; session: Session | null }): SignupOutcome {
  if (input.session) {
    return 'session'
  }

  const identities = input.user?.identities
  if (Array.isArray(identities) && identities.length === 0) {
    return 'exists'
  }

  return 'confirm'
}

export function normalizeAuthError(error: unknown, fallback = '认证失败，请稍后重试。') {
  if (!error || typeof error !== 'object') {
    return fallback
  }

  if ('message' in error && typeof error.message === 'string' && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function toAuthUserSummary(user: User | null): AuthUserSummary | null {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email ?? '',
  }
}

export async function fetchSessionUser(config: AuthConfig) {
  const client = getSupabaseClient(config)
  const { data, error } = await client.auth.getSession()

  if (error) {
    throw error
  }

  return data.session?.user ?? null
}

export async function loginWithPassword(config: AuthConfig, email: string, password: string) {
  const client = getSupabaseClient(config)
  const { data, error } = await client.auth.signInWithPassword({ email, password })

  if (error) {
    throw error
  }

  if (!data.user) {
    throw new Error('登录失败，请检查邮箱与密码。')
  }

  return data.user
}

export async function signupWithPassword(config: AuthConfig, email: string, password: string): Promise<SignupResult> {
  const client = getSupabaseClient(config)
  const { data, error } = await client.auth.signUp({ email, password })

  if (error) {
    throw error
  }

  const outcome = resolveSignupOutcome({
    user: data.user,
    session: data.session,
  })

  return {
    outcome,
    user: data.user,
  }
}

export async function logout(config: AuthConfig) {
  const client = getSupabaseClient(config)
  const { error } = await client.auth.signOut()

  if (error) {
    throw error
  }
}

export function subscribeAuthState(config: AuthConfig, onChange: (user: User | null) => void) {
  const client = getSupabaseClient(config)
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => {
    onChange(session?.user ?? null)
  })

  return () => {
    subscription.unsubscribe()
  }
}
