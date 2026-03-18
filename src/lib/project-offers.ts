import type { Lang } from '../i18n/lang'
import type { PortfolioProject } from '../types'

export type ProjectOfferKind = 'free' | 'limited_free' | 'paid'

export type ProjectOfferState = {
  baseKind: ProjectOfferKind
  effectiveKind: 'free' | 'paid'
  freeUntil: string | null
  remainingMs: number | null
}

export type ProjectPricingOverride = {
  access?: ProjectOfferKind | null
  freeUntil?: string | null
  singleUnlockEnabled?: boolean | null
  priceZh?: string | null
  priceEn?: string | null
  checkoutProductId?: string | null
}

export type SitePricingConfig = {
  version: 1
  updatedAt: string | null
  singleUnlock: {
    enabled: boolean
    defaultPriceZh: string | null
    defaultPriceEn: string | null
    defaultCheckoutProductId: string | null
  }
  allAccess: {
    enabled: boolean
    priceZh: string | null
    priceEn: string | null
    checkoutProductId: string | null
  }
  projects: Record<string, ProjectPricingOverride>
}

export type ProjectUnlockOptions = {
  singleEnabled: boolean
  singlePriceLabel: string | null
  singleCheckoutProductId: string | null
  allAccessEnabled: boolean
  allAccessPriceLabel: string | null
  allAccessCheckoutProductId: string | null
}

type ResolvedProjectPricing = {
  access: ProjectOfferKind
  freeUntil: string | null
  singleUnlockEnabled: boolean
  priceZh: string | null
  priceEn: string | null
  checkoutProductId: string | null
}

const DEFAULT_PROJECTS: Record<string, ProjectPricingOverride> = {}

export const DEFAULT_SITE_PRICING_CONFIG: SitePricingConfig = {
  version: 1,
  updatedAt: null,
  singleUnlock: {
    enabled: true,
    defaultPriceZh: null,
    defaultPriceEn: null,
    defaultCheckoutProductId: null,
  },
  allAccess: {
    enabled: true,
    priceZh: null,
    priceEn: null,
    checkoutProductId: null,
  },
  projects: DEFAULT_PROJECTS,
}

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase()
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized || null
}

function normalizeIso(value: unknown): string | null {
  const normalized = normalizeText(value)
  if (!normalized) {
    return null
  }

  const date = new Date(normalized)
  if (Number.isNaN(date.valueOf())) {
    return null
  }

  return date.toISOString()
}

function normalizeAccess(value: unknown): ProjectOfferKind | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (normalized === 'free' || normalized === 'limited_free' || normalized === 'paid') {
    return normalized
  }

  return null
}

function normalizeProjectOverride(value: unknown, fallback: ProjectPricingOverride = {}): ProjectPricingOverride {
  const input = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  return {
    access: normalizeAccess(input.access ?? input.kind) ?? fallback.access ?? null,
    freeUntil: normalizeIso(input.freeUntil) ?? normalizeIso(input.free_until) ?? fallback.freeUntil ?? null,
    singleUnlockEnabled:
      typeof input.singleUnlockEnabled === 'boolean'
        ? input.singleUnlockEnabled
        : typeof input.single_unlock_enabled === 'boolean'
          ? input.single_unlock_enabled
          : fallback.singleUnlockEnabled ?? null,
    priceZh: normalizeText(input.priceZh ?? input.price_zh) ?? fallback.priceZh ?? null,
    priceEn: normalizeText(input.priceEn ?? input.price_en) ?? fallback.priceEn ?? null,
    checkoutProductId:
      normalizeText(input.checkoutProductId ?? input.checkout_product_id) ?? fallback.checkoutProductId ?? null,
  }
}

export function normalizeSitePricingConfig(value: unknown, fallback = DEFAULT_SITE_PRICING_CONFIG): SitePricingConfig {
  const input = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const rawSingle = input.singleUnlock && typeof input.singleUnlock === 'object'
    ? (input.singleUnlock as Record<string, unknown>)
    : input.single_unlock && typeof input.single_unlock === 'object'
      ? (input.single_unlock as Record<string, unknown>)
      : {}
  const rawAllAccess = input.allAccess && typeof input.allAccess === 'object'
    ? (input.allAccess as Record<string, unknown>)
    : input.all_access && typeof input.all_access === 'object'
      ? (input.all_access as Record<string, unknown>)
      : {}
  const rawProjects = input.projects && typeof input.projects === 'object' ? (input.projects as Record<string, unknown>) : {}
  const projects: Record<string, ProjectPricingOverride> = {}

  for (const [slugKey, rawProject] of Object.entries(fallback.projects)) {
    projects[normalizeSlug(slugKey)] = normalizeProjectOverride(rawProject, fallback.projects[slugKey])
  }

  for (const [slugKey, rawProject] of Object.entries(rawProjects)) {
    const slug = normalizeSlug(slugKey)
    if (!slug) {
      continue
    }

    projects[slug] = normalizeProjectOverride(rawProject, projects[slug] ?? fallback.projects[slug] ?? {})
  }

  return {
    version: 1,
    updatedAt: normalizeIso(input.updatedAt ?? input.updated_at) ?? fallback.updatedAt,
    singleUnlock: {
      enabled: typeof rawSingle.enabled === 'boolean' ? rawSingle.enabled : fallback.singleUnlock.enabled,
      defaultPriceZh:
        normalizeText(rawSingle.defaultPriceZh ?? rawSingle.default_price_zh) ?? fallback.singleUnlock.defaultPriceZh,
      defaultPriceEn:
        normalizeText(rawSingle.defaultPriceEn ?? rawSingle.default_price_en) ?? fallback.singleUnlock.defaultPriceEn,
      defaultCheckoutProductId:
        normalizeText(rawSingle.defaultCheckoutProductId ?? rawSingle.default_checkout_product_id) ??
        fallback.singleUnlock.defaultCheckoutProductId,
    },
    allAccess: {
      enabled: typeof rawAllAccess.enabled === 'boolean' ? rawAllAccess.enabled : fallback.allAccess.enabled,
      priceZh: normalizeText(rawAllAccess.priceZh ?? rawAllAccess.price_zh) ?? fallback.allAccess.priceZh,
      priceEn: normalizeText(rawAllAccess.priceEn ?? rawAllAccess.price_en) ?? fallback.allAccess.priceEn,
      checkoutProductId:
        normalizeText(rawAllAccess.checkoutProductId ?? rawAllAccess.checkout_product_id) ??
        fallback.allAccess.checkoutProductId,
    },
    projects,
  }
}

export function applyCheckoutProductFallbacks(
  config: SitePricingConfig,
  fallback: { singleCheckoutProductId?: string | null; allAccessCheckoutProductId?: string | null },
): SitePricingConfig {
  return normalizeSitePricingConfig({
    ...config,
    singleUnlock: {
      ...config.singleUnlock,
      defaultCheckoutProductId: config.singleUnlock.defaultCheckoutProductId ?? normalizeText(fallback.singleCheckoutProductId),
    },
    allAccess: {
      ...config.allAccess,
      checkoutProductId: config.allAccess.checkoutProductId ?? normalizeText(fallback.allAccessCheckoutProductId),
    },
  })
}

function resolveProjectPricingConfig(slug: string, pricingConfig: SitePricingConfig): ResolvedProjectPricing {
  const override = pricingConfig.projects[normalizeSlug(slug)] ?? {}

  return {
    access: override.access ?? 'paid',
    freeUntil: override.freeUntil ?? null,
    singleUnlockEnabled: override.singleUnlockEnabled ?? true,
    priceZh: override.priceZh ?? pricingConfig.singleUnlock.defaultPriceZh,
    priceEn: override.priceEn ?? pricingConfig.singleUnlock.defaultPriceEn,
    checkoutProductId: override.checkoutProductId ?? pricingConfig.singleUnlock.defaultCheckoutProductId,
  }
}

function resolvePriceLabel(zh: string | null, en: string | null, lang: Lang): string | null {
  return lang === 'zh' ? zh : en
}

export function getProjectOfferState(
  project: Pick<PortfolioProject, 'slug'>,
  pricingConfig: SitePricingConfig = DEFAULT_SITE_PRICING_CONFIG,
  now = Date.now(),
): ProjectOfferState {
  const config = resolveProjectPricingConfig(project.slug, pricingConfig)
  const freeUntil = normalizeIso(config.freeUntil)

  if (config.access === 'free') {
    return {
      baseKind: 'free',
      effectiveKind: 'free',
      freeUntil: null,
      remainingMs: null,
    }
  }

  if (config.access === 'limited_free' && freeUntil) {
    const remainingMs = new Date(freeUntil).valueOf() - now
    if (remainingMs > 0) {
      return {
        baseKind: 'limited_free',
        effectiveKind: 'free',
        freeUntil,
        remainingMs,
      }
    }
  }

  return {
    baseKind: config.access,
    effectiveKind: 'paid',
    freeUntil,
    remainingMs: null,
  }
}

export function getProjectUnlockOptions(
  slug: string,
  pricingConfig: SitePricingConfig = DEFAULT_SITE_PRICING_CONFIG,
  lang: Lang,
): ProjectUnlockOptions {
  const projectConfig = resolveProjectPricingConfig(slug, pricingConfig)

  return {
    singleEnabled: pricingConfig.singleUnlock.enabled && projectConfig.singleUnlockEnabled,
    singlePriceLabel: resolvePriceLabel(projectConfig.priceZh, projectConfig.priceEn, lang),
    singleCheckoutProductId: projectConfig.checkoutProductId,
    allAccessEnabled: pricingConfig.allAccess.enabled,
    allAccessPriceLabel: resolvePriceLabel(pricingConfig.allAccess.priceZh, pricingConfig.allAccess.priceEn, lang),
    allAccessCheckoutProductId: pricingConfig.allAccess.checkoutProductId,
  }
}

export function isProjectPubliclyAccessibleBySlug(
  slug: string,
  pricingConfig: SitePricingConfig = DEFAULT_SITE_PRICING_CONFIG,
  now = Date.now(),
): boolean {
  const state = getProjectOfferState({ slug }, pricingConfig, now)
  return state.effectiveKind === 'free'
}

export function formatProjectOfferLabel(state: ProjectOfferState, lang: Lang): string {
  if (state.baseKind === 'free') {
    return lang === 'zh' ? '免费' : 'Free'
  }

  if (state.baseKind === 'limited_free' && state.effectiveKind === 'free') {
    return lang === 'zh' ? '限时免费' : 'Limited free'
  }

  return lang === 'zh' ? '付费' : 'Paid'
}

export function formatProjectOfferCountdown(state: ProjectOfferState, lang: Lang): string | null {
  if (state.baseKind !== 'limited_free' || state.effectiveKind !== 'free' || !state.remainingMs) {
    return null
  }

  const totalMinutes = Math.max(0, Math.floor(state.remainingMs / 60000))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  if (lang === 'zh') {
    if (days > 0) {
      return `${days}天 ${hours}小时`
    }
    if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  if (days > 0) {
    return `${days}d ${hours}h`
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function formatUnlockActionLabel(baseLabel: string, priceLabel: string | null): string {
  const normalized = priceLabel?.trim()
  if (!normalized) {
    return baseLabel
  }

  return `${baseLabel} · ${normalized}`
}
