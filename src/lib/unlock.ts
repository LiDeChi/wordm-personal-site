import type { AuthRole } from './auth'

export type UnlockGrantKind = 'single' | 'all_current' | 'all_current_plus_year' | 'free_pick'

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
  freeOfferTotal: number | null
  freePickedSlugs: string[]
}

export type FreeOfferStatus = {
  total: number
  used: number
  remaining: number
}

const STORAGE_KEY = 'wordm-project-unlocks-v1'

type UnlockStore = {
  users: Record<string, UserUnlockState>
}

const EMPTY_STATE: UserUnlockState = {
  grants: [],
  freeOfferTotal: null,
  freePickedSlugs: [],
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
    freeOfferTotal: state.freeOfferTotal,
    freePickedSlugs: [...state.freePickedSlugs],
  }
}

function createGrantId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function addOneYear(iso: string): string {
  const date = new Date(iso)
  date.setUTCFullYear(date.getUTCFullYear() + 1)
  return date.toISOString()
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

export function loadUnlockStateForUser(userId: string): UserUnlockState {
  const store = readStore()
  const found = store.users[userId]
  if (!found) {
    return cloneState(EMPTY_STATE)
  }

  return {
    grants: Array.isArray(found.grants) ? found.grants : [],
    freeOfferTotal: typeof found.freeOfferTotal === 'number' ? found.freeOfferTotal : null,
    freePickedSlugs: Array.isArray(found.freePickedSlugs) ? found.freePickedSlugs : [],
  }
}

export function saveUnlockStateForUser(userId: string, state: UserUnlockState) {
  const store = readStore()
  store.users[userId] = cloneState(state)
  writeStore(store)
}

export function getFreeOfferTotalByAccountAge(accountCreatedAt: string | null, now = new Date()): number {
  if (!accountCreatedAt) {
    return 0
  }

  const createdAt = new Date(accountCreatedAt)
  if (Number.isNaN(createdAt.valueOf())) {
    return 0
  }

  const ageMs = now.valueOf() - createdAt.valueOf()
  if (ageMs < 0) {
    return 0
  }

  const ageDays = ageMs / (1000 * 60 * 60 * 24)

  if (ageDays <= 7) {
    return 2
  }
  if (ageDays <= 30) {
    return 1
  }

  return 0
}

export function getFreeOfferStatus(state: UserUnlockState, accountCreatedAt: string | null, now = new Date()): FreeOfferStatus {
  const total = state.freeOfferTotal ?? getFreeOfferTotalByAccountAge(accountCreatedAt, now)
  const used = state.freePickedSlugs.length
  const remaining = Math.max(0, total - used)

  return {
    total,
    used,
    remaining,
  }
}

export function canAccessProject(
  projectSlug: string,
  role: AuthRole,
  state: UserUnlockState | null,
  now = new Date(),
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

    if (grant.kind === 'all_current' && grant.catalogSlugs?.includes(projectSlug)) {
      return true
    }

    if (grant.kind === 'all_current_plus_year') {
      if (grant.catalogSlugs?.includes(projectSlug)) {
        return true
      }

      if (grant.newUnlockUntil) {
        const until = new Date(grant.newUnlockUntil)
        if (!Number.isNaN(until.valueOf()) && now.valueOf() <= until.valueOf()) {
          return true
        }
      }
    }
  }

  return false
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

export function grantAllCurrentPlusYearUnlock(state: UserUnlockState, catalogSlugs: string[], now = new Date()): UserUnlockState {
  const grantedAt = now.toISOString()
  const next = cloneState(state)
  next.grants.push({
    id: createGrantId('all_current_plus_year'),
    kind: 'all_current_plus_year',
    catalogSlugs: normalizeCatalogSlugs(catalogSlugs),
    grantedAt,
    newUnlockUntil: addOneYear(grantedAt),
  })
  return next
}

export function grantFreeProjectUnlock(
  state: UserUnlockState,
  projectSlug: string,
  accountCreatedAt: string | null,
  now = new Date(),
): UserUnlockState {
  if (hasDirectProjectGrant(state, projectSlug)) {
    return state
  }

  const next = cloneState(state)
  if (next.freeOfferTotal === null) {
    next.freeOfferTotal = getFreeOfferTotalByAccountAge(accountCreatedAt, now)
  }

  const status = getFreeOfferStatus(next, accountCreatedAt, now)
  if (status.remaining <= 0) {
    throw new Error('FREE_OFFER_EXHAUSTED')
  }

  next.freePickedSlugs.push(projectSlug)
  next.grants.push({
    id: createGrantId('free'),
    kind: 'free_pick',
    projectSlug,
    grantedAt: now.toISOString(),
  })

  return next
}

