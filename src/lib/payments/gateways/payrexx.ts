/**
 * Payrexx gateway adapter.
 *
 * Wraps the existing `payrexx-client` (unchanged behaviour) behind the shared
 * `PaymentGateway` interface. Payrexx is the escrow-capable incumbent: it
 * RESERVES funds (authorize) and captures later, so `capturesOnPay = false`.
 *
 * NOTE: the LIVE Payrexx webhook keeps hitting `/api/payments/payrexx-webhook`
 * (the URL configured in the Payrexx dashboard). This adapter's verifyWebhook /
 * parseWebhook exist so Payrexx also works through the unified
 * `/api/payments/webhook/[provider]` route and so the registry is uniform.
 */

import crypto from 'crypto'
import { logger } from '@/lib/logger'
import { GATEWAY_STATUS } from '@/config/gateway-status'
import { PAYREXX_ENV, isPayrexxConfigured } from '@/config/payrexx'
import { createGateway as payrexxCreateGateway, captureTransaction } from '@/lib/payments/payrexx-client'
import type { PaymentGateway, ParsedWebhook } from './types'

interface PayrexxWebhookTx {
  id?: number
  status?: string
  referenceId?: string
  amount?: number
  currency?: string
}

/**
 * Payrexx signs webhook deliveries with a lowercase-hex SHA-256 HMAC of the raw
 * body (key = the per-webhook signing secret), delivered in `X-Webhook-Signature`.
 * Mirrors the live route so both entry points authenticate identically.
 */
async function verifyPayrexxSignature(rawBody: string, signature: string | null): Promise<boolean> {
  // Dev mock mode: skip only when Payrexx is explicitly not configured locally.
  if (process.env.NODE_ENV === 'development' && !isPayrexxConfigured()) {
    return true
  }
  const secret = process.env[PAYREXX_ENV.WEBHOOK_SECRET]
  if (!secret) {
    logger.error('PAYREXX_WEBHOOK_SECRET not set — rejecting webhook (fail closed)')
    return false
  }
  if (!signature) return false

  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(computed)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export const payrexxGateway: PaymentGateway = {
  slug: 'payrexx',
  capturesOnPay: false,

  async createGateway(params) {
    const gateway = await payrexxCreateGateway(params)
    // Provider ids are stringified at the boundary so the abstraction carries one
    // id type across rails (Payrexx numeric, Taler/BTCPay string).
    return { id: String(gateway.id), link: gateway.link }
  },

  async capture(providerTxId, amountCents) {
    const result = await captureTransaction(providerTxId, amountCents)
    return { id: String(result.id), status: GATEWAY_STATUS.CONFIRMED }
  },

  async verifyWebhook(rawBody, headers) {
    return verifyPayrexxSignature(rawBody, headers.get('x-webhook-signature'))
  },

  async parseWebhook(rawBody): Promise<ParsedWebhook> {
    let body: Record<string, unknown> = {}
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>
    } catch {
      body = {}
    }
    const tx = (body.transaction as PayrexxWebhookTx) || (body as PayrexxWebhookTx)
    return {
      referenceId: tx.referenceId ?? (body.referenceId as string | undefined) ?? null,
      providerTxId: tx.id != null ? String(tx.id) : null,
      status: tx.status ?? (body.status as string | undefined) ?? '',
      amountClaim: {
        amount: typeof tx.amount === 'number' ? tx.amount : null,
        currency: typeof tx.currency === 'string' ? tx.currency : null,
      },
    }
  },
}

export default payrexxGateway
