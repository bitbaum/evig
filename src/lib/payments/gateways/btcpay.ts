/**
 * BTCPay Server gateway adapter (Greenfield API — on-chain BTC + Lightning).
 *
 * Capture-on-pay: settlement is a chain/Lightning transfer, so `capture()` is a
 * no-op and Bitcoin is offered for non-escrow flows only. The invoice is priced
 * in CHF; the authoritative CHF amount for reconciliation is read back from the
 * invoice in `parseWebhook` — never trusted from the webhook body.
 */

import crypto from 'crypto'
import { logger } from '@/lib/logger'
import { GATEWAY_STATUS } from '@/config/gateway-status'
import {
  BTCPAY_ENV,
  BTCPAY_PROVIDER_SLUG,
  BTCPAY_INVOICE_CURRENCY,
  isBtcpayConfigured,
  isBtcpayWebhookSecretSet,
} from '@/config/btcpay'
import type { PaymentGateway, GatewayCreateParams, GatewayResult, ParsedWebhook } from './types'
import { mockRedirectLink, parseMockWebhook } from './mock'

function server(): string {
  return (process.env[BTCPAY_ENV.SERVER_URL] || '').replace(/\/$/, '')
}

function storeId(): string {
  return process.env[BTCPAY_ENV.STORE_ID] || ''
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `token ${process.env[BTCPAY_ENV.API_KEY]}`,
  }
}

/** BTCPay invoice event type → normalized gateway status. */
const EVENT_STATUS: Record<string, string> = {
  InvoiceSettled: GATEWAY_STATUS.RESERVED,
  InvoicePaymentSettled: GATEWAY_STATUS.RESERVED,
  InvoiceExpired: GATEWAY_STATUS.CANCELLED,
  InvoiceInvalid: GATEWAY_STATUS.DECLINED,
}

async function requeryInvoiceAmount(invoiceId: string): Promise<{ amount: number | null; currency: string | null }> {
  const res = await fetch(`${server()}/api/v1/stores/${storeId()}/invoices/${invoiceId}`, {
    headers: authHeaders(),
  })
  if (!res.ok) {
    logger.error('BTCPay invoice re-query failed', { invoiceId, status: res.status })
    return { amount: null, currency: null }
  }
  const data = (await res.json()) as { amount?: string; currency?: string }
  const num = data.amount != null ? parseFloat(data.amount) : NaN
  return {
    amount: Number.isFinite(num) ? Math.round(num * 100) : null,
    currency: data.currency ?? null,
  }
}

export const btcpayGateway: PaymentGateway = {
  slug: BTCPAY_PROVIDER_SLUG,
  capturesOnPay: true,

  async createGateway(params: GatewayCreateParams): Promise<GatewayResult> {
    if (!isBtcpayConfigured()) {
      return {
        id: params.referenceId,
        link: mockRedirectLink(BTCPAY_PROVIDER_SLUG, {
          referenceId: params.referenceId,
          amount: params.amount,
          currency: params.currency,
          successRedirectUrl: params.successRedirectUrl,
          failedRedirectUrl: params.failedRedirectUrl,
          cancelRedirectUrl: params.cancelRedirectUrl,
        }),
      }
    }

    const res = await fetch(`${server()}/api/v1/stores/${storeId()}/invoices`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        // Invoice priced in CHF; BTCPay quotes the BTC amount to the buyer.
        amount: (params.amount / 100).toFixed(2),
        currency: BTCPAY_INVOICE_CURRENCY,
        metadata: { orderId: params.referenceId },
        checkout: { redirectURL: params.successRedirectUrl },
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      logger.error('BTCPay invoice create failed', { status: res.status, body: text })
      throw new Error(`BTCPay API ${res.status}: ${text}`)
    }
    const data = (await res.json()) as { id?: string; checkoutLink?: string }
    if (!data.id || !data.checkoutLink) {
      throw new Error('BTCPay invoice response missing id/checkoutLink')
    }
    return { id: data.id, link: data.checkoutLink }
  },

  async capture(providerTxId) {
    return { id: providerTxId, status: GATEWAY_STATUS.CONFIRMED }
  },

  async verifyWebhook(rawBody, headers) {
    // Dev / not provisioned → mock deliveries are unsigned.
    if (!isBtcpayConfigured()) return true
    const secret = process.env[BTCPAY_ENV.WEBHOOK_SECRET]
    if (!isBtcpayWebhookSecretSet() || !secret) {
      logger.error('BTCPAY_WEBHOOK_SECRET not set — rejecting webhook (fail closed)')
      return false
    }
    // Header form: `BTCPay-Sig: sha256=<hex>` (HMAC-SHA256 of the raw body).
    const header = headers.get('btcpay-sig')
    if (!header) return false
    const provided = header.startsWith('sha256=') ? header.slice('sha256='.length) : header
    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    const a = Buffer.from(computed)
    const b = Buffer.from(provided)
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  },

  async parseWebhook(rawBody): Promise<ParsedWebhook> {
    if (!isBtcpayConfigured()) return parseMockWebhook(rawBody)

    let body: { type?: string; invoiceId?: string; metadata?: { orderId?: string } } = {}
    try {
      body = JSON.parse(rawBody)
    } catch {
      body = {}
    }
    const invoiceId = body.invoiceId ?? null
    const status = body.type && EVENT_STATUS[body.type] ? EVENT_STATUS[body.type] : ''
    // Re-query the invoice for the authoritative CHF amount + our order id.
    const amountClaim = invoiceId ? await requeryInvoiceAmount(invoiceId) : { amount: null, currency: null }
    return {
      referenceId: body.metadata?.orderId ?? null,
      providerTxId: invoiceId,
      status,
      amountClaim,
    }
  },
}

export default btcpayGateway
