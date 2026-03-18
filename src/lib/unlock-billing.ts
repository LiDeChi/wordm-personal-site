import type { AuthConfig } from './auth'
import { getSupabaseClient } from './auth'

export type UnlockCheckoutKind = 'single' | 'all_access'

type CheckoutInput = {
  productId: string
  successUrl: string
  cancelUrl: string
}

export async function createUnlockCheckoutUrl(
  config: AuthConfig,
  input: CheckoutInput,
): Promise<string> {
  const productId = input.productId.trim()
  if (!productId) {
    throw new Error('CHECKOUT_PRODUCT_MISSING')
  }

  const client = getSupabaseClient(config)
  const { data, error } = await client.auth.getSession()
  if (error) {
    throw error
  }

  const accessToken = data.session?.access_token
  if (!accessToken) {
    throw new Error('UNAUTHENTICATED')
  }

  const endpoint = `${config.supabaseUrl.replace(/\/$/, '')}/functions/v1/creem-checkout`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      productId,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    }),
  })

  const payload = (await response.json().catch(() => null)) as { url?: string; error?: unknown } | null

  if (!response.ok) {
    if (typeof payload?.error === 'string' && payload.error.trim()) {
      throw new Error(`CHECKOUT_REQUEST_FAILED: ${payload.error}`)
    }
    throw new Error(`CHECKOUT_REQUEST_FAILED: ${response.status}`)
  }

  if (typeof payload?.url !== 'string' || !payload.url.trim()) {
    throw new Error('CHECKOUT_URL_MISSING')
  }

  return payload.url
}
