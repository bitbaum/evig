/**
 * Tests for the multi-rail gateway layer: status parity, registry dispatch,
 * provider capabilities, escrow filtering, the mock-webhook parser, and the
 * Taler/BTCPay adapters (mock paths + BTCPay HMAC verification).
 */

import crypto from 'crypto'
import { GATEWAY_STATUS } from '@/config/gateway-status'
import { PAYREXX_TRANSACTION_STATUS } from '@/lib/payments/payrexx-client'
import {
  PAYMENT_PROVIDERS,
  getProviderMeta,
  getAvailableProviders,
  isProviderAvailable,
  DEFAULT_PROVIDER_SLUG,
} from '@/config/payment-providers'
import { getGateway, hasGateway, captureViaGateway } from '@/lib/payments/gateways'
import { parseMockWebhook } from '@/lib/payments/gateways/mock'
import { talerGateway } from '@/lib/payments/gateways/taler'
import { btcpayGateway } from '@/lib/payments/gateways/btcpay'
import { BTCPAY_ENV } from '@/config/btcpay'

// ============================================================================
// Normalized status parity with Payrexx (zero-behaviour-change guarantee)
// ============================================================================

describe('GATEWAY_STATUS parity', () => {
  it('has the exact same values as the incumbent Payrexx status strings', () => {
    // The normalized vocabulary MUST equal Payrexx's wire strings so the switch
    // to a shared enum is a pure rename — no stored-row migration.
    expect(GATEWAY_STATUS.RESERVED).toBe(PAYREXX_TRANSACTION_STATUS.RESERVED)
    expect(GATEWAY_STATUS.CONFIRMED).toBe(PAYREXX_TRANSACTION_STATUS.CONFIRMED)
    expect(GATEWAY_STATUS.REFUNDED).toBe(PAYREXX_TRANSACTION_STATUS.REFUNDED)
    expect(GATEWAY_STATUS.PARTIALLY_REFUNDED).toBe(PAYREXX_TRANSACTION_STATUS.PARTIALLY_REFUNDED)
    expect(GATEWAY_STATUS.WAITING).toBe(PAYREXX_TRANSACTION_STATUS.WAITING)
    expect(GATEWAY_STATUS.CANCELLED).toBe(PAYREXX_TRANSACTION_STATUS.CANCELLED)
    expect(GATEWAY_STATUS.DECLINED).toBe(PAYREXX_TRANSACTION_STATUS.DECLINED)
    expect(GATEWAY_STATUS.ERROR).toBe(PAYREXX_TRANSACTION_STATUS.ERROR)
  })
})

// ============================================================================
// Registry
// ============================================================================

describe('gateway registry', () => {
  it('resolves each known rail', () => {
    expect(getGateway('payrexx').slug).toBe('payrexx')
    expect(getGateway('taler').slug).toBe('taler')
    expect(getGateway('btcpay').slug).toBe('btcpay')
  })

  it('defaults to Payrexx', () => {
    expect(getGateway().slug).toBe(DEFAULT_PROVIDER_SLUG)
  })

  it('throws on an unknown rail', () => {
    expect(() => getGateway('sepa')).toThrow(/Unknown payment provider/)
  })

  it('reports membership', () => {
    expect(hasGateway('taler')).toBe(true)
    expect(hasGateway('nope')).toBe(false)
  })
})

// ============================================================================
// captureViaGateway
// ============================================================================

describe('captureViaGateway', () => {
  it('is a no-op that reports CONFIRMED for capture-on-pay rails', async () => {
    const taler = await captureViaGateway('taler', 'order-1', 5000)
    expect(taler.status).toBe(GATEWAY_STATUS.CONFIRMED)
    expect(taler.id).toBe('order-1')

    const btc = await captureViaGateway('btcpay', 'inv-1', 5000)
    expect(btc.status).toBe(GATEWAY_STATUS.CONFIRMED)
  })

  it('captures via Payrexx (mock returns CONFIRMED when unconfigured)', async () => {
    const res = await captureViaGateway('payrexx', '424242', 5000)
    expect(res.status).toBe(GATEWAY_STATUS.CONFIRMED)
    expect(res.id).toBe('424242')
  })
})

// ============================================================================
// Provider capability registry
// ============================================================================

describe('payment provider capabilities', () => {
  it('marks Payrexx escrow-capable and the new rails capture-on-pay', () => {
    expect(getProviderMeta('payrexx')?.supportsEscrow).toBe(true)
    expect(getProviderMeta('payrexx')?.capturesOnPay).toBe(false)
    expect(getProviderMeta('taler')?.capturesOnPay).toBe(true)
    expect(getProviderMeta('taler')?.supportsEscrow).toBe(false)
    expect(getProviderMeta('btcpay')?.capturesOnPay).toBe(true)
    expect(getProviderMeta('btcpay')?.supportsEscrow).toBe(false)
  })

  it('exposes exactly three rails', () => {
    expect(PAYMENT_PROVIDERS.map((p) => p.slug).sort()).toEqual(['btcpay', 'payrexx', 'taler'])
  })

  it('excludes capture-on-pay rails from escrow-required flows', () => {
    const escrow = getAvailableProviders({ requireEscrow: true }).map((p) => p.slug)
    expect(escrow).toContain('payrexx')
    expect(escrow).not.toContain('taler')
    expect(escrow).not.toContain('btcpay')
  })

  it('offers all rails for non-escrow flows (dev)', () => {
    const all = getAvailableProviders({ requireEscrow: false }).map((p) => p.slug)
    expect(all).toEqual(expect.arrayContaining(['payrexx', 'taler', 'btcpay']))
  })

  it('isProviderAvailable enforces the escrow rule', () => {
    expect(isProviderAvailable('taler', { requireEscrow: true })).toBe(false)
    expect(isProviderAvailable('taler', { requireEscrow: false })).toBe(true)
  })
})

// ============================================================================
// Mock webhook parsing
// ============================================================================

describe('parseMockWebhook', () => {
  it('reads the normalized dev body', () => {
    const parsed = parseMockWebhook(
      JSON.stringify({ referenceId: 'tx-9', providerTxId: 'mock-1', status: 'reserved', amount: 5000, currency: 'CHF' }),
    )
    expect(parsed.referenceId).toBe('tx-9')
    expect(parsed.providerTxId).toBe('mock-1')
    expect(parsed.status).toBe('reserved')
    expect(parsed.amountClaim).toEqual({ amount: 5000, currency: 'CHF' })
  })

  it('degrades safely on garbage', () => {
    const parsed = parseMockWebhook('not json')
    expect(parsed.referenceId).toBeNull()
    expect(parsed.amountClaim).toEqual({ amount: null, currency: null })
  })
})

// ============================================================================
// Taler adapter (mock path — unconfigured)
// ============================================================================

describe('taler adapter (mock)', () => {
  it('returns a mock checkout link when unconfigured', async () => {
    const result = await talerGateway.createGateway({
      amount: 5000,
      currency: 'CHF',
      referenceId: 'tx-taler',
      successRedirectUrl: 'http://localhost:3000/ok',
      failedRedirectUrl: 'http://localhost:3000/fail',
      cancelRedirectUrl: 'http://localhost:3000/cancel',
    })
    expect(result.id).toBe('tx-taler')
    expect(result.link).toContain('/api/payments/mock-redirect')
    expect(result.link).toContain('provider=taler')
  })

  it('capture is a no-op reporting CONFIRMED', async () => {
    const res = await talerGateway.capture('tx-taler', 5000)
    expect(res.status).toBe(GATEWAY_STATUS.CONFIRMED)
  })

  it('parses the mock webhook body when unconfigured', async () => {
    const parsed = await talerGateway.parseWebhook(
      JSON.stringify({ referenceId: 'tx-taler', providerTxId: 'tx-taler', status: 'reserved', amount: 5000, currency: 'CHF' }),
    )
    expect(parsed.referenceId).toBe('tx-taler')
    expect(parsed.status).toBe('reserved')
  })
})

// ============================================================================
// BTCPay adapter (mock path + HMAC verification)
// ============================================================================

describe('btcpay adapter (mock)', () => {
  it('returns a mock checkout link when unconfigured', async () => {
    const result = await btcpayGateway.createGateway({
      amount: 5000,
      currency: 'CHF',
      referenceId: 'tx-btc',
      successRedirectUrl: 'http://localhost:3000/ok',
      failedRedirectUrl: 'http://localhost:3000/fail',
      cancelRedirectUrl: 'http://localhost:3000/cancel',
    })
    expect(result.link).toContain('/api/payments/mock-redirect')
    expect(result.link).toContain('provider=btcpay')
  })

  it('verifyWebhook is unsigned-OK when unconfigured (dev)', async () => {
    const ok = await btcpayGateway.verifyWebhook('{}', new Headers())
    expect(ok).toBe(true)
  })
})

describe('btcpay HMAC verification (configured)', () => {
  const SECRET = 'test-webhook-secret'
  const body = JSON.stringify({ type: 'InvoiceSettled', invoiceId: 'inv-1', metadata: { orderId: 'tx-1' } })

  beforeAll(() => {
    process.env[BTCPAY_ENV.SERVER_URL] = 'https://btcpay.example'
    process.env[BTCPAY_ENV.API_KEY] = 'k'
    process.env[BTCPAY_ENV.STORE_ID] = 's'
    process.env[BTCPAY_ENV.WEBHOOK_SECRET] = SECRET
  })
  afterAll(() => {
    delete process.env[BTCPAY_ENV.SERVER_URL]
    delete process.env[BTCPAY_ENV.API_KEY]
    delete process.env[BTCPAY_ENV.STORE_ID]
    delete process.env[BTCPAY_ENV.WEBHOOK_SECRET]
  })

  it('accepts a correctly signed delivery', async () => {
    const sig = crypto.createHmac('sha256', SECRET).update(body).digest('hex')
    const ok = await btcpayGateway.verifyWebhook(body, new Headers({ 'btcpay-sig': `sha256=${sig}` }))
    expect(ok).toBe(true)
  })

  it('rejects a wrong signature', async () => {
    const ok = await btcpayGateway.verifyWebhook(body, new Headers({ 'btcpay-sig': 'sha256=deadbeef' }))
    expect(ok).toBe(false)
  })

  it('rejects a missing signature', async () => {
    const ok = await btcpayGateway.verifyWebhook(body, new Headers())
    expect(ok).toBe(false)
  })
})
