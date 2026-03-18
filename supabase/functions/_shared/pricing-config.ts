export type ProjectOfferKind = "free" | "limited_free" | "paid";

export type ProjectPricingOverride = {
  access?: ProjectOfferKind | null;
  freeUntil?: string | null;
  singleUnlockEnabled?: boolean | null;
  priceZh?: string | null;
  priceEn?: string | null;
  checkoutProductId?: string | null;
};

export type SitePricingConfig = {
  version: 1;
  updatedAt: string | null;
  singleUnlock: {
    enabled: boolean;
    defaultPriceZh: string | null;
    defaultPriceEn: string | null;
    defaultCheckoutProductId: string | null;
  };
  allAccess: {
    enabled: boolean;
    priceZh: string | null;
    priceEn: string | null;
    checkoutProductId: string | null;
  };
  projects: Record<string, ProjectPricingOverride>;
};

const DEFAULT_PROJECTS: Record<string, ProjectPricingOverride> = {};

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
};

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function normalizeIso(value: unknown): string | null {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.valueOf())) {
    return null;
  }

  return date.toISOString();
}

function normalizeAccess(value: unknown): ProjectOfferKind | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "free" || normalized === "limited_free" || normalized === "paid") {
    return normalized;
  }

  return null;
}

function normalizeProjectOverride(value: unknown, fallback: ProjectPricingOverride = {}): ProjectPricingOverride {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    access: normalizeAccess(input.access ?? input.kind) ?? fallback.access ?? null,
    freeUntil: normalizeIso(input.freeUntil ?? input.free_until) ?? fallback.freeUntil ?? null,
    singleUnlockEnabled:
      typeof input.singleUnlockEnabled === "boolean"
        ? input.singleUnlockEnabled
        : typeof input.single_unlock_enabled === "boolean"
          ? input.single_unlock_enabled
          : fallback.singleUnlockEnabled ?? null,
    priceZh: normalizeText(input.priceZh ?? input.price_zh) ?? fallback.priceZh ?? null,
    priceEn: normalizeText(input.priceEn ?? input.price_en) ?? fallback.priceEn ?? null,
    checkoutProductId:
      normalizeText(input.checkoutProductId ?? input.checkout_product_id) ?? fallback.checkoutProductId ?? null,
  };
}

export function normalizeSitePricingConfig(
  value: unknown,
  fallback: SitePricingConfig = DEFAULT_SITE_PRICING_CONFIG,
): SitePricingConfig {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const rawSingle = input.singleUnlock && typeof input.singleUnlock === "object"
    ? (input.singleUnlock as Record<string, unknown>)
    : input.single_unlock && typeof input.single_unlock === "object"
      ? (input.single_unlock as Record<string, unknown>)
      : {};
  const rawAllAccess = input.allAccess && typeof input.allAccess === "object"
    ? (input.allAccess as Record<string, unknown>)
    : input.all_access && typeof input.all_access === "object"
      ? (input.all_access as Record<string, unknown>)
      : {};
  const rawProjects = input.projects && typeof input.projects === "object" ? (input.projects as Record<string, unknown>) : {};
  const projects: Record<string, ProjectPricingOverride> = {};

  for (const [slugKey, rawProject] of Object.entries(fallback.projects)) {
    projects[normalizeSlug(slugKey)] = normalizeProjectOverride(rawProject, fallback.projects[slugKey]);
  }

  for (const [slugKey, rawProject] of Object.entries(rawProjects)) {
    const slug = normalizeSlug(slugKey);
    if (!slug) {
      continue;
    }

    projects[slug] = normalizeProjectOverride(rawProject, projects[slug] ?? fallback.projects[slug] ?? {});
  }

  return {
    version: 1,
    updatedAt: normalizeIso(input.updatedAt ?? input.updated_at) ?? fallback.updatedAt,
    singleUnlock: {
      enabled: typeof rawSingle.enabled === "boolean" ? rawSingle.enabled : fallback.singleUnlock.enabled,
      defaultPriceZh:
        normalizeText(rawSingle.defaultPriceZh ?? rawSingle.default_price_zh) ?? fallback.singleUnlock.defaultPriceZh,
      defaultPriceEn:
        normalizeText(rawSingle.defaultPriceEn ?? rawSingle.default_price_en) ?? fallback.singleUnlock.defaultPriceEn,
      defaultCheckoutProductId:
        normalizeText(rawSingle.defaultCheckoutProductId ?? rawSingle.default_checkout_product_id) ??
        fallback.singleUnlock.defaultCheckoutProductId,
    },
    allAccess: {
      enabled: typeof rawAllAccess.enabled === "boolean" ? rawAllAccess.enabled : fallback.allAccess.enabled,
      priceZh: normalizeText(rawAllAccess.priceZh ?? rawAllAccess.price_zh) ?? fallback.allAccess.priceZh,
      priceEn: normalizeText(rawAllAccess.priceEn ?? rawAllAccess.price_en) ?? fallback.allAccess.priceEn,
      checkoutProductId:
        normalizeText(rawAllAccess.checkoutProductId ?? rawAllAccess.checkout_product_id) ??
        fallback.allAccess.checkoutProductId,
    },
    projects,
  };
}
