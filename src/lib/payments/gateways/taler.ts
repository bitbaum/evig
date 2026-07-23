/**
 * GNU Taler gateway adapter (merchant backend, Greenfield REST).
 *
 * Capture-on-pay: the wallet transfers value at checkout, so `capture()` is a
 * no-op and Taler is offered for non-escrow flows only. Payment TRUTH is never
 * trusted from the webhook body — `parseWebhook` re-queries the authenticated
 * backend for the order's real status + contract amount.
 */

import { logger } from '@/lib/logger'
import { GATEWAY_STATUS } from '@/config/gateway-status'
import {
  TALER_ENV,
  TALER_PROVIDER_SLUG,
  TALER_SETTLEMENT_CURRENCY,
  isTalerConfigured,
  isTalerWebhookSecretSet,
} from '@/config/taler'
import type { PaymentGateway, GatewayCreateParams, GatewayResult, ParsedWebhook } from './types'
import { mockRedirectLink, parseMockWebhook } from './mock'

function backend(): string {
  return (process.env[TALER_ENV.BACKEND_URL] || '').replace(/\/$/, '')
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env[TALER_ENV.API_TOKEN]}`,
  }
}

/** Cents → Taler `CURRENCY:decimal` amount string (e.g. 1250 → "CHF:12.50"). */
function toTalerAmount(amountCents: number, currency = TALER_SETTLEMENT_CURRENCY): string {
  return `${currency}:${(amountCents / 100).toFixed(2)}`
}

/** Taler amount string → smallest unit (e.g. "CHF:12.50" → 1250). */
function fromTalerAmount(amount: string | undefined): { amount: number | null; currency: string | null } {
  if (!amount || typeof amount !== 'string' || !amount.includes(':')) {
    return { amount: null, currency: null }
  }
  const [currency, value] = amount.split(':')
  const num = parseFloat(value)
  return {
    amount: Number.isFinite(num) ? Math.round(num * 100) : null,
    currency: currency || null,
  }
}

export const talerGateway: PaymentGateway = {
  slug: TALER_PROVIDER_SLUG,
  capturesOnPay: true,

  async createGateway(params: GatewayCreateParams): Promise<GatewayResult> {
    // Dev / not provisioned → mock checkout so the loop is testable end-to-end.
    if (!isTalerConfigured()) {
      return {
        id: params.referenceId,
        link: mockRedirectLink(TALER_PROVIDER_SLUG, {
          referenceId: params.referenceId,
          amount: params.amount,
          currency: params.currency,
          successRedirectUrl: params.successRedirectUrl,
          failedRedirectUrl: params.failedRedirectUrl,
          cancelRedirectUrl: params.cancelRedirectUrl,
        }),
      }
    }

    const res = await fetch(`${backend()}/private/orders`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        order: {
          // Our reference id IS the Taler order id → webhook re-query is a
          // direct lookup, no side mapping table needed.
          order_id: params.referenceId,
          amount: toTalerAmount(params.amount, params.currency),
          summary: params.purpose || `Revamp-IT ${params.referenceId}`,
          fulfillment_url: params.successRedirectUrl,
        },
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      logger.error('Taler order create failed', { status: res.status, body: text })
      throw new Error(`Taler API ${res.status}: ${text}`)
    }
    const data = (await res.json()) as { order_id?: string; token?: string }
    const orderId = data.order_id || params.referenceId
    // Customer-facing order page (wallet triggers on this URL).
    const token = data.token ? `?token=${encodeURIComponent(data.token)}` : ''
    return { id: orderId, link: `${backend()}/orders/${orderId}${token}` }
  },

  // Capture-on-pay: nothing to capture. Return CONFIRMED for a uniform contract.
  async capture(providerTxId) {
    return { id: providerTxId, status: GATEWAY_STATUS.CONFIRMED }
  },

  async verifyWebhook(rawBody, headers) {
    // Dev / not provisioned → mock deliveries are unsigned.
    if (!isTalerConfigured()) return true
    // Optional shared-secret header; real payment truth is the authenticated
    // re-query in parseWebhook, so this is defence-in-depth, not the sole gate.
    if (!isTalerWebhookSecretSet()) return true
    const provided = headers.get('taler-webhook-secret')
    return provided === process.env[TALER_ENV.WEBHOOK_SECRET]
  },

  async parseWebhook(rawBody): Promise<ParsedWebhook> {
    if (!isTalerConfigured()) return parseMockWebhook(rawBody)

    // The delivery only tells us WHICH order changed; re-query the backend for
    // the authoritative status + contract amount (never trust the body).
    let orderId: string | null = null
    try {
      const body = JSON.parse(rawBody) as { order_id?: string }
      orderId = body.order_id ?? null
    } catch {
      orderId = null
    }
    if (!orderId) {
      return { referenceId: null, providerTxId: null, status: '', amountClaim: { amount: null, currency: null } }
    }

    const res = await fetch(`${backend()}/private/orders/${orderId}`, { headers: authHeaders() })
    if (!res.ok) {
      logger.error('Taler order re-query failed', { orderId, status: res.status })
      return { referenceId: orderId, providerTxId: orderId, status: GATEWAY_STATUS.WAITING, amountClaim: { amount: null, currency: null } }
    }
    const data = (await res.json()) as {
      order_status?: string
      refunded?: boolean
      contract_terms?: { amount?: string }
    }

    let status: string = GATEWAY_STATUS.WAITING
    if (data.refunded) status = GATEWAY_STATUS.REFUNDED
    else if (data.order_status === 'paid') status = GATEWAY_STATUS.RESERVED
    else if (data.order_status === 'claimed') status = GATEWAY_STATUS.WAITING

    return {
      referenceId: orderId,
      providerTxId: orderId,
      status,
      amountClaim: fromTalerAmount(data.contract_terms?.amount),
    }
  },
}

export default talerGateway
