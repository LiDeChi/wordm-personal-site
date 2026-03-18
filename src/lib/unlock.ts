import type { AuthRole } from './auth'
import { isProjectPubliclyAccessibleBySlug, type SitePricingConfig } from './project-offers'

export type UnlockGrantKind = 'single' | 'all_access' | 'all_current' | 'all_current_plus_year' | 'free_pick'

export type UnlockGrant = {
  id: string
  kind: UnlockGrantKind
  grantedAt: string
  projectSlug?: string
  catalogSlugs?: string[]
  newUnlockUntil?: string
}

export type UserUnlockState = {
  grants: UnlockGrant[]
}

const STORAGE_KEY = 'wordm-project-unlocks-v1'

type UnlockStore = {
  users: Record<string, UserUnlockState>
}

const EMPTY_STATE: UserUnlockState = {
  grants: [],
}

function hasWindow() {
  return typeof window !== 'undefined'
}

function readStore(): UnlockStore {
  if (!hasWindow()) {
    return { users: {} }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { users: {} }
    }

    const parsed = JSON.parse(raw) as UnlockStore
    if (!parsed || typeof parsed !== 'object' || typeof parsed.users !== 'object' || !parsed.users) {
      return { users: {} }
    }

    return parsed
  } catch {
    return { users: {} }
  }
}

function writeStore(store: UnlockStore) {
  if (!hasWindow()) {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Ignore localStorage write failures.
  }
}

function cloneState(state: UserUnlockState): UserUnlockState {
  return {
    grants: [...state.grants],
  }
}

function createGrantId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function normalizeCatalogSlugs(catalogSlugs: string[]): string[] {
  return [...new Set(catalogSlugs.map((slug) => slug.trim().toLowerCase()).filter(Boolean))].sort()
}

function hasDirectProjectGrant(state: UserUnlockState, projectSlug: string): boolean {
  return state.grants.some((grant) => {
    if ((grant.kind === 'single' || grant.kind === 'free_pick') && grant.projectSlug === projectSlug) {
      return true
    }
    return false
  })
}

export function hasProjectPremiumAccess(
  projectSlug: string,
  role: AuthRole,
  state: UserUnlockState | null,
): boolean {
  if (role === 'admin' || role === 'tester') {
    return true
  }

  if (!state || role === 'guest') {
    return false
  }

  for (const grant of state.grants) {
    if ((grant.kind === 'single' || grant.kind === 'free_pick') && grant.projectSlug === projectSlug) {
      return true
    }

    if (grant.kind === 'all_access' || grant.kind === 'all_current_plus_year') {
      return true
    }

    if (grant.kind === 'all_current' && grant.catalogSlugs?.includes(projectSlug)) {
      return true
    }
  }

  return false
}

export function loadUnlockStateForUser(userId: string): UserUnlockState {
  const store = readStore()
  const found = store.users[userId]
  if (!found) {
    return cloneState(EMPTY_STATE)
  }

  return {
    grants: Array.isArray(found.grants) ? found.grants : [],
  }
}

export function saveUnlockStateForUser(userId: string, state: UserUnlockState) {
  const store = readStore()
  store.users[userId] = cloneState(state)
  writeStore(store)
}

export function canAccessProject(
  projectSlug: string,
  role: AuthRole,
  state: UserUnlockState | null,
  pricingConfig?: SitePricingConfig,
  now = new Date(),
): boolean {
  if (isProjectPubliclyAccessibleBySlug(projectSlug, pricingConfig, now.valueOf())) {
    return true
  }

  return hasProjectPremiumAccess(projectSlug, role, state)
}

export function grantSingleProjectUnlock(state: UserUnlockState, projectSlug: string, now = new Date()): UserUnlockState {
  if (hasDirectProjectGrant(state, projectSlug)) {
    return state
  }

  const next = cloneState(state)
  next.grants.push({
    id: createGrantId('single'),
    kind: 'single',
    projectSlug,
    grantedAt: now.toISOString(),
  })
  return next
}

export function grantAllCurrentUnlock(state: UserUnlockState, catalogSlugs: string[], now = new Date()): UserUnlockState {
  const next = cloneState(state)
  next.grants.push({
    id: createGrantId('all_current'),
    kind: 'all_current',
    catalogSlugs: normalizeCatalogSlugs(catalogSlugs),
    grantedAt: now.toISOString(),
  })
  return next
}

export function grantAllAccessUnlock(state: UserUnlockState, catalogSlugs: string[], now = new Date()): UserUnlockState {
  const next = cloneState(state)
  next.grants.push({
    id: createGrantId('all_access'),
    kind: 'all_access',
    catalogSlugs: normalizeCatalogSlugs(catalogSlugs),
    grantedAt: now.toISOString(),
  })
  return next
}
