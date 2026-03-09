import type { ShareLinkRecord, ShareScope } from './share-links'

type AdminSharePayload = {
  id?: unknown
  label?: unknown
  status?: unknown
  token?: unknown
  createdAt?: unknown
  expiresAt?: unknown
  lastAccessedAt?: unknown
  visitCount?: unknown
  issuedBy?: unknown
  issuedByLabel?: unknown
  allowPortfolio?: unknown
  allowBlog?: unknown
  allowDeploy?: unknown
  allowResume?: unknown
  allowAllProjects?: unknown
  allowedProjectSlugs?: unknown
  deletedCount?: unknown
  error?: unknown
  links?: unknown
}

type AdminShareLinkRecord = ShareLinkRecord & {
  issuedBy: 'user' | 'admin'
  issuedByLabel: string | null
}

type CreateAdminShareInput = {
  label?: string | null
  expiresInDays: number
  scope: ShareScope
}

function normalizeIso(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('SHARE_INVALID_DATE')
  }

  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    throw new Error('SHARE_INVALID_DATE')
  }

  return date.toISOString()
}

function normalizeOptionalIso(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    return null
  }

  return date.toISOString()
}

function normalizeScope(input: Partial<ShareScope> | null | undefined): ShareScope {
  const allowedProjectSlugs = Array.isArray(input?.allowedProjectSlugs)
    ? input.allowedProjectSlugs
        .map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : ''))
        .filter(Boolean)
    : []

  return {
    allowPortfolio: Boolean(input?.allowPortfolio),
    allowBlog: Boolean(input?.allowBlog),
    allowDeploy: Boolean(input?.allowDeploy),
    allowResume: Boolean(input?.allowResume),
    allowAllProjects: Boolean(input?.allowAllProjects),
    allowedProjectSlugs: [...new Set(allowedProjectSlugs)],
  }
}

function normalizeError(payload: AdminSharePayload | null, status: number) {
  if (typeof payload?.error === 'string' && payload.error.trim()) {
    return payload.error.trim()
  }
  return `ADMIN_SHARE_REQUEST_FAILED_${status}`
}

function toShareLinkRecord(payload: AdminSharePayload | null): AdminShareLinkRecord {
  const source = payload ?? {}
  const expiresAt = normalizeIso(source.expiresAt)
  const visitCount = typeof source.visitCount === 'number' ? source.visitCount : 0
  return {
    id: typeof source.id === 'string' ? source.id : '',
    label: typeof source.label === 'string' && source.label.trim() ? source.label.trim() : null,
    status: (typeof source.status === 'string' ? source.status : 'active') as ShareLinkRecord['status'],
    createdAt: normalizeIso(source.createdAt),
    expiresAt,
    lastAccessedAt: normalizeOptionalIso(source.lastAccessedAt),
    visitCount,
    issuedBy: source.issuedBy === 'admin' ? 'admin' : 'user',
    issuedByLabel: typeof source.issuedByLabel === 'string' && source.issuedByLabel.trim() ? source.issuedByLabel.trim() : null,
    scope: normalizeScope({
      allowPortfolio: Boolean(source.allowPortfolio),
      allowBlog: Boolean(source.allowBlog),
      allowDeploy: Boolean(source.allowDeploy),
      allowResume: Boolean(source.allowResume),
      allowAllProjects: Boolean(source.allowAllProjects),
      allowedProjectSlugs: Array.isArray(source.allowedProjectSlugs)
        ? source.allowedProjectSlugs.filter((item): item is string => typeof item === 'string')
        : [],
    }),
  }
}

async function requestAdminShare(action: string, body: Record<string, unknown> = {}) {
  const response = await fetch('/__admin_api/share-links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...body }),
  })

  const payload = (await response.json().catch(() => null)) as AdminSharePayload | null
  if (!response.ok) {
    throw new Error(normalizeError(payload, response.status))
  }

  return payload
}

export async function listAdminShareLinks() {
  const payload = await requestAdminShare('list')
  const rows = payload && Array.isArray(payload.links) ? payload.links : []
  return rows.map((item) => toShareLinkRecord(item as AdminSharePayload))
}

export async function createAdminShareLink(input: CreateAdminShareInput) {
  const payload = await requestAdminShare('create', {
    label: input.label ?? null,
    expiresInDays: input.expiresInDays,
    scope: input.scope,
  })
  const token = payload && typeof payload.token === 'string' ? payload.token.trim() : ''
  if (!token) {
    throw new Error('SHARE_TOKEN_MISSING')
  }
  return {
    ...toShareLinkRecord(payload),
    token,
  }
}

export async function revokeAdminShareLink(id: string) {
  await requestAdminShare('revoke', { id })
}

export async function purgeAdminShareLinks() {
  const payload = await requestAdminShare('purge')
  return payload && typeof payload.deletedCount === 'number' ? payload.deletedCount : 0
}

export type { AdminShareLinkRecord }
