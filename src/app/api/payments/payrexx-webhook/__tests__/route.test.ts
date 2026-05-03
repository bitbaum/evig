/**
 * @jest-environment node
 *
 * Tests for POST /api/payments/payrexx-webhook
 *
 * Behaviors locked:
 *   POST - 401 (invalid signature in prod), 400 (missing referenceId/status),
 *          404 (no matching record), 200 (marketplace handled), 200 (generic handled)
 *
 * Dev mode (NODE_ENV=development, no PAYREXX_INSTANCE) skips signature verification.
 */

jest.mock('@/lib/services/payment-webhook', () => ({
  lookupPaymentByReferenceId: jest.fn(),
  handleMarketplacePayment: jest.fn(),
  handleGenericPayment: jest.fn(),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, details?: unknown) => NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiUnauthorized: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 401 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'
import {
  lookupPaymentByReferenceId,
  handleMarketplacePayment,
  handleGenericPayment,
} from '@/lib/services/payment-webhook'

const mockLookup = lookupPaymentByReferenceId as jest.MockedFunction<typeof lookupPaymentByReferenceId>
const mockHandleMarketplace = handleMarketplacePayment as jest.MockedFunction<typeof handleMarketplacePayment>
const mockHandleGeneric = handleGenericPayment as jest.MockedFunction<typeof handleGenericPayment>

const MOCK_ORDER = { id: 'order-1', referenceId: 'ref-abc', status: 'pending' }
const MOCK_TX = { id: 'tx-1', referenceId: 'ref-abc', status: 'pending' }

function makeWebhookRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/payments/payrexx-webhook', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  // Dev mode: skip signature verification
  process.env.NODE_ENV = 'development'
  delete process.env.PAYREXX_INSTANCE
  delete process.env.PAYREXX_WEBHOOK_SECRET
})

// ============================================================================
// Signature verification — production mode
// ============================================================================

describe('POST /api/payments/payrexx-webhook — signature verification', () => {
  it('returns 401 when signature is missing in production mode', async () => {
    // Simulate production: set PAYREXX_INSTANCE so signature check runs
    process.env.NODE_ENV = 'production'
    process.env.PAYREXX_INSTANCE = 'myshop'
    process.env.PAYREXX_WEBHOOK_SECRET = 'secret'

    const req = makeWebhookRequest({ transaction: { id: 1, status: 'reserved', referenceId: 'ref-1' } })
    const response = await POST(req)
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toMatch(/signature/i)
  })
})

// ============================================================================
// Validation — dev mode (signature skipped)
// ============================================================================

describe('POST /api/payments/payrexx-webhook — validation (dev mode)', () => {
  it('returns 400 when body is not valid JSON', async () => {
    const req = new NextRequest('http://localhost/api/payments/payrexx-webhook', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 when referenceId is missing', async () => {
    const req = makeWebhookRequest({ transaction: { id: 1, status: 'reserved' } })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 when status is missing', async () => {
    const req = makeWebhookRequest({ transaction: { id: 1, referenceId: 'ref-1' } })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// Not found
// ============================================================================

describe('POST /api/payments/payrexx-webhook — not found', () => {
  it('returns 404 when no matching payment record exists', async () => {
    mockLookup.mockResolvedValue({ type: 'none' } as ReturnType<typeof lookupPaymentByReferenceId> extends Promise<infer T> ? T : never)
    const req = makeWebhookRequest({ transaction: { id: 1, status: 'reserved', referenceId: 'ref-unknown' } })
    const response = await POST(req)
    expect(response.status).toBe(404)
  })
})

// ============================================================================
// Success — marketplace
// ============================================================================

describe('POST /api/payments/payrexx-webhook — marketplace payment', () => {
  it('returns 200 and calls handleMarketplacePayment', async () => {
    mockLookup.mockResolvedValue({ type: 'marketplace', order: MOCK_ORDER } as never)
    mockHandleMarketplace.mockResolvedValue(undefined as never)

    const req = makeWebhookRequest({
      transaction: { id: 42, status: 'reserved', referenceId: 'ref-abc' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.received).toBe(true)
    expect(mockHandleMarketplace).toHaveBeenCalledWith(MOCK_ORDER, 'reserved', '42')
  })
})

// ============================================================================
// Success — generic payment transaction
// ============================================================================

describe('POST /api/payments/payrexx-webhook — generic payment', () => {
  it('returns 200 and calls handleGenericPayment', async () => {
    mockLookup.mockResolvedValue({ type: 'payment_transaction', paymentTx: MOCK_TX } as never)
    mockHandleGeneric.mockResolvedValue(undefined as never)

    const req = makeWebhookRequest({
      transaction: { id: 99, status: 'confirmed', referenceId: 'ref-abc' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(mockHandleGeneric).toHaveBeenCalledWith(MOCK_TX, 'confirmed', '99')
  })

  it('supports flat body format (referenceId at root level)', async () => {
    mockLookup.mockResolvedValue({ type: 'payment_transaction', paymentTx: MOCK_TX } as never)
    mockHandleGeneric.mockResolvedValue(undefined as never)

    const req = makeWebhookRequest({ id: 77, status: 'cancelled', referenceId: 'ref-abc' })
    const response = await POST(req)
    expect(response.status).toBe(200)
    expect(mockLookup).toHaveBeenCalledWith('ref-abc')
  })
})
