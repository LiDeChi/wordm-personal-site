import { getSupabaseClient, type AuthConfig } from './auth'
import { DEFAULT_SITE_PRICING_CONFIG, normalizeSitePricingConfig, type SitePricingConfig } from './project-offers'

type PricingPayload = {
  config?: unknown
  updatedAt?: unknown
  error?: unknown
}

function normalizeError(payload: PricingPayload | null, status: number) {
  if (typeof payload?.error === 'string' && payload.error.trim()) {
    return payload.error.trim()
  }

  return `PRICING_REQUEST_FAILED_${status}`
}

function withUpdatedAt(config: SitePricingConfig, payload: PricingPayload | null) {
  const updatedAt = typeof payload?.updatedAt === 'string' && payload.updatedAt.trim() ? payload.updatedAt.trim() : null
  if (!updatedAt) {
    return config
  }

  return {
    ...config,
    updatedAt,
  }
}

export async function fetchPricingConfigFromSupabase(config: AuthConfig): Promise<SitePricingConfig> {
  if (!config.supabaseUrl) {
    return DEFAULT_SITE_PRICING_CONFIG
  }

  const response = await fetch(`${config.supabaseUrl.replace(/\/$/, '')}/functions/v1/pricing-config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '{}',
  })

  const payload = (await response.json().catch(() => null)) as PricingPayload | null
  if (!response.ok) {
    throw new Error(normalizeError(payload, response.status))
  }

  return withUpdatedAt(normalizeSitePricingConfig(payload?.config), payload)
}

export async function savePricingConfigFromSupabase(
  config: AuthConfig,
  pricingConfig: SitePricingConfig,
): Promise<SitePricingConfig> {
  const client = getSupabaseClient(config)
  const { data, error } = await client.auth.getSession()
  if (error) {
    throw error
  }

  const accessToken = data.session?.access_token
  if (!accessToken) {
    throw new Error('UNAUTHENTICATED')
  }

  const response = await fetch(`${config.supabaseUrl.replace(/\/$/, '')}/functions/v1/manage-pricing-config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      config: normalizeSitePricingConfig(pricingConfig),
    }),
  })

  const payload = (await response.json().catch(() => null)) as PricingPayload | null
  if (!response.ok) {
    throw new Error(normalizeError(payload, response.status))
  }

  return withUpdatedAt(normalizeSitePricingConfig(payload?.config), payload)
}
