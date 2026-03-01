import type { AuthConfig } from './auth'
import { getSupabaseClient } from './auth'

export type DeployTicketScope = 'center_control_personal'
export type DeployTarget = 'local' | 'remote'

type CreateDeployTicketInput = {
  scope: DeployTicketScope
  target: DeployTarget
  expiresInSec?: number
}

type CreateDeployTicketPayload = {
  ticket: string
  expiresAt: string
  resolveEndpoint: string
  installScriptUrl: string
}

function normalizeIso(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('DEPLOY_TICKET_INVALID_EXPIRES_AT')
  }

  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    throw new Error('DEPLOY_TICKET_INVALID_EXPIRES_AT')
  }

  return date.toISOString()
}

export async function createDeployTicket(
  config: AuthConfig,
  input: CreateDeployTicketInput,
): Promise<CreateDeployTicketPayload> {
  const client = getSupabaseClient(config)
  const { data, error } = await client.auth.getSession()
  if (error) {
    throw error
  }

  const accessToken = data.session?.access_token
  if (!accessToken) {
    throw new Error('UNAUTHENTICATED')
  }

  const endpoint = `${config.supabaseUrl.replace(/\/$/, '')}/functions/v1/create-deploy-ticket`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      scope: input.scope,
      target: input.target,
      expiresInSec: input.expiresInSec ?? 600,
    }),
  })

  const payload = (await response.json().catch(() => null)) as
    | {
        ticket?: unknown
        expiresAt?: unknown
        resolveEndpoint?: unknown
        installScriptUrl?: unknown
        error?: unknown
      }
    | null

  if (!response.ok) {
    if (typeof payload?.error === 'string' && payload.error.trim()) {
      throw new Error(`DEPLOY_TICKET_REQUEST_FAILED: ${payload.error}`)
    }

    throw new Error(`DEPLOY_TICKET_REQUEST_FAILED: ${response.status}`)
  }

  const ticket = typeof payload?.ticket === 'string' ? payload.ticket.trim() : ''
  const resolveEndpoint = typeof payload?.resolveEndpoint === 'string' ? payload.resolveEndpoint.trim() : ''
  const installScriptUrl = typeof payload?.installScriptUrl === 'string' ? payload.installScriptUrl.trim() : ''

  if (!ticket) {
    throw new Error('DEPLOY_TICKET_MISSING')
  }

  if (!resolveEndpoint) {
    throw new Error('DEPLOY_TICKET_ENDPOINT_MISSING')
  }

  if (!installScriptUrl) {
    throw new Error('DEPLOY_SCRIPT_URL_MISSING')
  }

  return {
    ticket,
    expiresAt: normalizeIso(payload?.expiresAt),
    resolveEndpoint,
    installScriptUrl,
  }
}
