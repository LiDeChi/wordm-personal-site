import type { AuthConfig } from './auth'
import { getSupabaseClient, isAuthConfigured } from './auth'
import type { UnlockGrant, UnlockGrantKind, UserUnlockState } from './unlock'

type UnlockStatePayload = {
  grants?: unknown
  freeOfferTotal?: unknown
  freePickedSlugs?: unknown
}

type ApplyUnlockGrantInput = {
  kind: UnlockGrantKind
  projectSlug?: string | null
  catalogSlugs?: string[] | null
}

function toIsoOrNull(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined
  }

  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    return undefined
  }

  return date.toISOString()
}

function toStringOrUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  return normalized || undefined
}

function normalizeGrant(value: unknown): UnlockGrant | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const row = value as Record<string, unknown>
  const id = toStringOrUndefined(row.id)
  const kind = toStringOrUndefined(row.kind) as UnlockGrantKind | undefined
  const grantedAt = toIsoOrNull(row.grantedAt ?? row.granted_at)

  if (!id || !kind || !grantedAt) {
    return null
  }

  if (!['single', 'all_current', 'all_current_plus_year', 'free_pick'].includes(kind)) {
    return null
  }

  const rawCatalogSlugs = row.catalogSlugs ?? row.catalog_slugs
  const catalogSlugs = Array.isArray(rawCatalogSlugs)
    ? rawCatalogSlugs
        .map((slug) => (typeof slug === 'string' ? slug.trim().toLowerCase() : ''))
        .filter((slug): slug is string => Boolean(slug))
    : undefined

  return {
    id,
    kind,
    grantedAt,
    projectSlug: toStringOrUndefined(row.projectSlug ?? row.project_slug)?.toLowerCase(),
    catalogSlugs: catalogSlugs?.length ? [...new Set(catalogSlugs)].sort() : undefined,
    newUnlockUntil: toIsoOrNull(row.newUnlockUntil ?? row.new_unlock_until),
  }
}

function normalizeStatePayload(payload: unknown): UserUnlockState {
  const object = payload && typeof payload === 'object' ? (payload as UnlockStatePayload) : {}
  const grants = Array.isArray(object.grants)
    ? object.grants.map(normalizeGrant).filter((grant): grant is UnlockGrant => Boolean(grant))
    : []
  const freeOfferTotal =
    typeof object.freeOfferTotal === 'number' && Number.isFinite(object.freeOfferTotal)
      ? object.freeOfferTotal
      : null
  const freePickedSlugs = Array.isArray(object.freePickedSlugs)
    ? object.freePickedSlugs
        .map((slug) => (typeof slug === 'string' ? slug.trim().toLowerCase() : ''))
        .filter((slug): slug is string => Boolean(slug))
    : []

  return {
    grants,
    freeOfferTotal,
    freePickedSlugs: [...new Set(freePickedSlugs)],
  }
}

function ensureRemoteEnabled(config: AuthConfig) {
  if (!isAuthConfigured(config)) {
    throw new Error('UNLOCK_REMOTE_DISABLED')
  }
}

export async function fetchUnlockStateFromSupabase(config: AuthConfig): Promise<UserUnlockState> {
  ensureRemoteEnabled(config)
  const client = getSupabaseClient(config)
  const { data, error } = await client.rpc('wordm_get_unlock_state')

  if (error) {
    throw error
  }

  return normalizeStatePayload(data)
}

export async function applyUnlockGrantFromSupabase(
  config: AuthConfig,
  input: ApplyUnlockGrantInput,
): Promise<UserUnlockState> {
  ensureRemoteEnabled(config)
  const client = getSupabaseClient(config)
  const { data, error } = await client.rpc('wordm_apply_unlock_grant', {
    p_kind: input.kind,
    p_project_slug: input.projectSlug ?? null,
    p_catalog_slugs: input.catalogSlugs ?? null,
  })

  if (error) {
    throw error
  }

  return normalizeStatePayload(data)
}
