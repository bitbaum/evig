/**
 * Dev-only mock redirect helper, shared by rails that lack a local sandbox.
 *
 * When a rail is unconfigured (dev), its adapter returns a link to this generic
 * mock page instead of a real hosted checkout. The page (see
 * `src/app/api/payments/mock-redirect/route.ts`) lets the developer simulate a
 * successful/failed payment, POSTing a NORMALIZED webhook back to
 * `/api/payments/webhook/<provider>` which the adapter's `parseWebhook` reads via
 * `parseMockWebhook`. This keeps the whole pay → webhook → reconcile loop
 * testable end-to-end with zero external services.
 */

import type { ParsedWebhook } from './types'
import { APP_URL } from '@/config/urls'

export const MOCK_REDIRECT_PATH = '/api/payments/mock-redirect'

export interface MockRedirectParams {
  referenceId: string
  amount: number
  currency: string
  successRedirectUrl: string
  failedRedirectUrl: string
  cancelRedirectUrl: string
}

/** Build the dev mock-checkout URL for a given provider. */
export function mockRedirectLink(providerSlug: string, params: MockRedirectParams): string {
  const q = new URLSearchParams({
    provider: providerSlug,
    referenceId: params.referenceId,
    amount: String(params.amount),
    currency: params.currency,
    successUrl: params.successRedirectUrl,
    failedUrl: params.failedRedirectUrl,
    cancelUrl: params.cancelRedirectUrl,
  })
  return `${APP_URL}${MOCK_REDIRECT_PATH}?${q.toString()}`
}

/**
 * Parse a NORMALIZED mock webhook body:
 * `{ referenceId, providerTxId, status, amount, currency }`.
 * Used by adapters when the rail is unconfigured (dev), where the authoritative
 * re-query path is unavailable.
 */
export function parseMockWebhook(rawBody: string): ParsedWebhook {
  let body: Record<string, unknown> = {}
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    body = {}
  }
  return {
    referenceId: typeof body.referenceId === 'string' ? body.referenceId : null,
    providerTxId: typeof body.providerTxId === 'string' ? body.providerTxId : null,
    status: typeof body.status === 'string' ? body.status : '',
    amountClaim: {
      amount: typeof body.amount === 'number' ? body.amount : null,
      currency: typeof body.currency === 'string' ? body.currency : null,
    },
  }
}
