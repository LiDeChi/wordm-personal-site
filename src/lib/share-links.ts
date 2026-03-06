import { getSupabaseClient, type AuthConfig } from './auth'
import { withSiteParams } from './lang-url'
import type { Lang } from '../i18n/lang'
import type { PortfolioProject } from '../types'

export type ShareLinkStatus = 'active' | 'revoked' | 'expired'
export type ShareResolveStatus = 'idle' | 'loading' | 'active' | 'invalid' | 'revoked' | 'expired' | 'error'
export type DeployTarget = 'local' | 'remote'

export type ShareScope = {
  allowPortfolio: boolean
  allowBlog: boolean
  allowDeploy: boolean
  allowResume: boolean
  allowAllProjects: boolean
  allowedProjectSlugs: string[]
}

export type ShareLinkRecord = {
  id: string
  label: string | null
  status: ShareLinkStatus
  createdAt: string
  expiresAt: string
  scope: ShareScope
}

export type ShareAccess = ShareLinkRecord

export type CreateShareLinkInput = {
  label?: string | null
  expiresInDays: number
  scope: ShareScope
}

export type CreateShareLinkResult = ShareLinkRecord & {
  token: string
}

type ShareLinkRow = {
  id: string
  label: string | null
  status: ShareLinkStatus
  created_at: string
  expires_at: string
  allow_portfolio: boolean
  allow_blog: boolean
  allow_deploy: boolean
  allow_resume: boolean
  allow_all_projects: boolean
  allowed_project_slugs: string[] | null
}

type ShareLinkApiPayload = {
  id?: unknown
  label?: unknown
  status?: unknown
  token?: unknown
  createdAt?: unknown
  expiresAt?: unknown
  allowPortfolio?: unknown
  allowBlog?: unknown
  allowDeploy?: unknown
  allowResume?: unknown
  allowAllProjects?: unknown
  allowedProjectSlugs?: unknown
  error?: unknown
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

function toShareLinkRecord(row: ShareLinkRow): ShareLinkRecord {
  const expiresAt = normalizeIso(row.expires_at)
  const isExpired = row.status === 'active' && new Date(expiresAt).getTime() <= Date.now()

  return {
    id: row.id,
    label: typeof row.label === 'string' && row.label.trim() ? row.label.trim() : null,
    status: isExpired ? 'expired' : row.status,
    createdAt: normalizeIso(row.created_at),
    expiresAt,
    scope: normalizeScope({
      allowPortfolio: row.allow_portfolio,
      allowBlog: row.allow_blog,
      allowDeploy: row.allow_deploy,
      allowResume: row.allow_resume,
      allowAllProjects: row.allow_all_projects,
      allowedProjectSlugs: row.allowed_project_slugs ?? [],
    }),
  }
}

function normalizeShareError(payload: { error?: unknown } | null, status: number) {
  if (typeof payload?.error === 'string' && payload.error.trim()) {
    return payload.error.trim()
  }

  return `SHARE_REQUEST_FAILED_${status}`
}

export function canShareAccessView(view: 'portfolio' | 'blog' | 'deploy' | 'resume', shareAccess: ShareAccess | null) {
  if (!shareAccess) {
    return false
  }

  if (view === 'portfolio') {
    return shareAccess.scope.allowPortfolio
  }
  if (view === 'blog') {
    return shareAccess.scope.allowBlog
  }
  if (view === 'deploy') {
    return shareAccess.scope.allowDeploy
  }
  return shareAccess.scope.allowResume
}

export function canShareAccessProject(slug: string, shareAccess: ShareAccess | null) {
  if (!shareAccess) {
    return false
  }

  if (shareAccess.scope.allowAllProjects) {
    return true
  }

  return shareAccess.scope.allowedProjectSlugs.includes(slug.trim().toLowerCase())
}

export function buildShareEntryUrl(
  shareToken: string,
  lang: Lang,
  shareAccess: ShareScope,
  projects: PortfolioProject[],
): string {
  if (shareAccess.allowPortfolio) {
    return withSiteParams('https://wordm.us', { lang, shareToken })
  }

  if (shareAccess.allowBlog) {
    return withSiteParams('https://wordm.us?view=blog', { lang, shareToken })
  }

  if (shareAccess.allowDeploy) {
    return withSiteParams('https://wordm.us?view=deploy', { lang, shareToken })
  }

  if (shareAccess.allowResume) {
    return withSiteParams('https://resume.wordm.us', { lang, shareToken })
  }

  const project = shareAccess.allowAllProjects
    ? projects[0] ?? null
    : projects.find((item) => shareAccess.allowedProjectSlugs.includes(item.slug)) ?? null

  if (project) {
    return withSiteParams(project.subdomainUrl, { lang, shareToken })
  }

  return withSiteParams('https://wordm.us', { lang, shareToken })
}

export async function createShareLink(config: AuthConfig, input: CreateShareLinkInput): Promise<CreateShareLinkResult> {
  const client = getSupabaseClient(config)
  const { data, error } = await client.auth.getSession()
  if (error) {
    throw error
  }

  const accessToken = data.session?.access_token
  if (!accessToken) {
    throw new Error('UNAUTHENTICATED')
  }

  const response = await fetch(`${config.supabaseUrl.replace(/\/$/, '')}/functions/v1/create-share-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      label: input.label ?? null,
      expiresInDays: input.expiresInDays,
      scope: input.scope,
    }),
  })

  const payload = (await response.json().catch(() => null)) as ShareLinkApiPayload | null

  if (!response.ok) {
    throw new Error(normalizeShareError(payload, response.status))
  }

  const token = typeof payload?.token === 'string' ? payload.token.trim() : ''
  if (!token) {
    throw new Error('SHARE_TOKEN_MISSING')
  }

  const record = toShareLinkRecord({
    id: typeof payload?.id === 'string' ? payload.id : '',
    label: typeof payload?.label === 'string' ? payload.label : null,
    status: (typeof payload?.status === 'string' ? payload.status : 'active') as ShareLinkStatus,
    created_at: typeof payload?.createdAt === 'string' ? payload.createdAt : '',
    expires_at: typeof payload?.expiresAt === 'string' ? payload.expiresAt : '',
    allow_portfolio: Boolean(payload?.allowPortfolio),
    allow_blog: Boolean(payload?.allowBlog),
    allow_deploy: Boolean(payload?.allowDeploy),
    allow_resume: Boolean(payload?.allowResume),
    allow_all_projects: Boolean(payload?.allowAllProjects),
    allowed_project_slugs: Array.isArray(payload?.allowedProjectSlugs)
      ? payload.allowedProjectSlugs.filter((item): item is string => typeof item === 'string')
      : [],
  })

  return {
    ...record,
    token,
  }
}

export async function resolveShareLink(supabaseUrl: string, token: string): Promise<ShareAccess> {
  const normalizedToken = token.trim()
  if (!supabaseUrl || !normalizedToken) {
    throw new Error('SHARE_TOKEN_REQUIRED')
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/resolve-share-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token: normalizedToken }),
  })

  const payload = (await response.json().catch(() => null)) as ShareLinkApiPayload | null

  if (!response.ok) {
    throw new Error(normalizeShareError(payload, response.status))
  }

  return toShareLinkRecord({
    id: typeof payload?.id === 'string' ? payload.id : '',
    label: typeof payload?.label === 'string' ? payload.label : null,
    status: (typeof payload?.status === 'string' ? payload.status : 'active') as ShareLinkStatus,
    created_at: typeof payload?.createdAt === 'string' ? payload.createdAt : '',
    expires_at: typeof payload?.expiresAt === 'string' ? payload.expiresAt : '',
    allow_portfolio: Boolean(payload?.allowPortfolio),
    allow_blog: Boolean(payload?.allowBlog),
    allow_deploy: Boolean(payload?.allowDeploy),
    allow_resume: Boolean(payload?.allowResume),
    allow_all_projects: Boolean(payload?.allowAllProjects),
    allowed_project_slugs: Array.isArray(payload?.allowedProjectSlugs)
      ? payload.allowedProjectSlugs.filter((item): item is string => typeof item === 'string')
      : [],
  })
}

export async function revokeShareLink(config: AuthConfig, shareLinkId: string): Promise<void> {
  const client = getSupabaseClient(config)
  const { data, error } = await client.auth.getSession()
  if (error) {
    throw error
  }

  const accessToken = data.session?.access_token
  if (!accessToken) {
    throw new Error('UNAUTHENTICATED')
  }

  const response = await fetch(`${config.supabaseUrl.replace(/\/$/, '')}/functions/v1/revoke-share-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ id: shareLinkId }),
  })

  const payload = (await response.json().catch(() => null)) as { error?: unknown } | null
  if (!response.ok) {
    throw new Error(normalizeShareError(payload, response.status))
  }
}

export async function listOwnShareLinks(config: AuthConfig): Promise<ShareLinkRecord[]> {
  const client = getSupabaseClient(config)
  const { data, error } = await client
    .from('share_links')
    .select(
      'id, label, status, created_at, expires_at, allow_portfolio, allow_blog, allow_deploy, allow_resume, allow_all_projects, allowed_project_slugs',
    )
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => toShareLinkRecord(row as ShareLinkRow))
}
