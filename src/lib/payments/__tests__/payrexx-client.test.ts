/**
 * Tests for the Payrexx API client (lib/payments/payrexx-client.ts).
 *
 * Payrexx is the payment provider; the client wraps Gateway create +
 * Transaction capture/cancel/refund. When PAYREXX_INSTANCE / API_SECRET
 * env vars are missing it falls back to a mock gateway so dev works
 * without a Payrexx account — these tests cover both:
 *
 *   1. Mock mode: env vars absent → no network call, returns mock data
 *      pointing at our /api/payments/payrexx-mock-redirect route
 *   2. Live mode: env vars set → fetch is called with the right
 *      method/path/HMAC-signed body
 *
 * Also locks the PAYREXX_TRANSACTION_STATUS constants — webhook
 * handlers compare incoming status strings against these, so a typo
 * here silently breaks payment confirmation.
 */

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import {
  PAYREXX_TRANSACTION_STATUS,
  createGateway,
  captureTransaction,
  cancelTransaction,
  refundTransaction,
} from '../payrexx-client'

const ORIGINAL_ENV = { ...process.env }
const mockFetch = global.fetch as jest.Mock

beforeEach(() => {
  mockFetch.mockReset()
  // Default to mock mode (no env vars) — individual tests opt into live mode.
  delete process.env.PAYREXX_INSTANCE
  delete process.env.PAYREXX_API_SECRET
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

const baseGatewayParams = {
  amount: 5000,
  currency: 'CHF',
  referenceId: 'order-123',
  successRedirectUrl: 'https://x.test/success',
  failedRedirectUrl: 'https://x.test/failed',
  cancelRedirectUrl: 'https://x.test/cancel',
  purpose: 'Bestellung 123',
}

// ============================================================================
// Status constants
// ============================================================================

describe('PAYREXX_TRANSACTION_STATUS', () => {
  it('uses the exact string values Payrexx sends in webhooks', () => {
    // These strings are the external API contract — tests prevent silent
    // typos that would break webhook status routing.
    expect(PAYREXX_TRANSACTION_STATUS.RESERVED).toBe('reserved')
    expect(PAYREXX_TRANSACTION_STATUS.CONFIRMED).toBe('confirmed')
    expect(PAYREXX_TRANSACTION_STATUS.REFUNDED).toBe('refunded')
    expect(PAYREXX_TRANSACTION_STATUS.PARTIALLY_REFUNDED).toBe('partially-refunded')
    expect(PAYREXX_TRANSACTION_STATUS.WAITING).toBe('waiting')
    expect(PAYREXX_TRANSACTION_STATUS.CANCELLED).toBe('cancelled')
    expect(PAYREXX_TRANSACTION_STATUS.DECLINED).toBe('declined')
    expect(PAYREXX_TRANSACTION_STATUS.ERROR).toBe('error')
  })
})

// ============================================================================
// Mock mode (env vars absent)
// ============================================================================

describe('createGateway — mock mode', () => {
  it('does not call fetch when env vars are missing', async () => {
    await createGateway(baseGatewayParams)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns a numeric mock id and a link to the local mock redirect route', async () => {
    const result = await createGateway(baseGatewayParams)
    expect(typeof result.id).toBe('number')
    expect(result.link).toContain('/api/payments/payrexx-mock-redirect')
  })

  it('encodes referenceId, amount, and currency into the mock link', async () => {
    const result = await createGateway(baseGatewayParams)
    expect(result.link).toContain('referenceId=order-123')
    expect(result.link).toContain('amount=5000')
    expect(result.link).toContain('currency=CHF')
  })

  it('passes through all three redirect URLs', async () => {
    const result = await createGateway(baseGatewayParams)
    // URL params are url-encoded; check the encoded forms
    expect(decodeURIComponent(result.link)).toContain('successUrl=https://x.test/success')
    expect(decodeURIComponent(result.link)).toContain('failedUrl=https://x.test/failed')
    expect(decodeURIComponent(result.link)).toContain('cancelUrl=https://x.test/cancel')
  })
})

describe('captureTransaction — mock mode', () => {
  it('does not call fetch and returns CONFIRMED status', async () => {
    const result = await captureTransaction('42', 5000)
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.id).toBe(42)
    expect(result.status).toBe(PAYREXX_TRANSACTION_STATUS.CONFIRMED)
  })
})

describe('cancelTransaction — mock mode', () => {
  it('does not call fetch and returns cancelled status', async () => {
    const result = await cancelTransaction('99')
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.id).toBe(99)
    // Mock uses PAYMENT_STATUS.CANCELLED ('cancelled')
    expect(result.status).toBe('cancelled')
  })
})

describe('refundTransaction — mock mode', () => {
  it('does not call fetch and returns refunded status', async () => {
    const result = await refundTransaction('77', 1000)
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.id).toBe(77)
    expect(result.status).toBe('refunded')
  })
})

// ============================================================================
// Live mode (env vars set) — verifies fetch is called with right shape
// ============================================================================

describe('createGateway — live mode', () => {
  beforeEach(() => {
    process.env.PAYREXX_INSTANCE = 'revampit-test'
    process.env.PAYREXX_API_SECRET = 'secret-key-for-tests'
  })

  it('POSTs to Gateway/ on the right Payrexx instance URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: 999, link: 'https://payrexx.com/p/abc' }] }),
    })

    await createGateway(baseGatewayParams)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.payrexx.com/v1.0/Gateway/?instance=revampit-test')
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
  })

  it('signs the request body with HMAC and includes ApiSignature param', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: 1, link: 'https://payrexx.com/p/x' }] }),
    })

    await createGateway(baseGatewayParams)

    const [, init] = mockFetch.mock.calls[0]
    expect(init.body).toContain('amount=5000')
    expect(init.body).toContain('currency=CHF')
    expect(init.body).toContain('referenceId=order-123')
    expect(init.body).toContain('reservation=true')
    expect(init.body).toContain('ApiSignature=')
  })

  it('returns the gateway id + link from the API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: 12345, link: 'https://payrexx.com/p/abcdef' }] }),
    })

    const result = await createGateway(baseGatewayParams)
    expect(result).toEqual({ id: 12345, link: 'https://payrexx.com/p/abcdef' })
  })

  it('throws on non-2xx Payrexx response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad request: missing currency',
    })

    await expect(createGateway(baseGatewayParams)).rejects.toThrow('Payrexx API 400')
  })
})

describe('captureTransaction — live mode', () => {
  beforeEach(() => {
    process.env.PAYREXX_INSTANCE = 'revampit-test'
    process.env.PAYREXX_API_SECRET = 'secret-key-for-tests'
  })

  it('POSTs to Transaction/<id>/ with the captured amount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: 555, status: 'confirmed' }] }),
    })

    await captureTransaction('555', 5000)

    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.payrexx.com/v1.0/Transaction/555/?instance=revampit-test')
    expect(init.method).toBe('POST')
    expect(init.body).toContain('amount=5000')
  })
})

describe('cancelTransaction — live mode', () => {
  beforeEach(() => {
    process.env.PAYREXX_INSTANCE = 'revampit-test'
    process.env.PAYREXX_API_SECRET = 'secret-key-for-tests'
  })

  it('DELETEs Transaction/<id>/', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: 777, status: 'cancelled' }] }),
    })

    await cancelTransaction('777')

    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.payrexx.com/v1.0/Transaction/777/?instance=revampit-test')
    expect(init.method).toBe('DELETE')
  })
})

describe('refundTransaction — live mode', () => {
  beforeEach(() => {
    process.env.PAYREXX_INSTANCE = 'revampit-test'
    process.env.PAYREXX_API_SECRET = 'secret-key-for-tests'
  })

  it('POSTs to Transaction/<id>/refund with amount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: 888, status: 'refunded' }] }),
    })

    await refundTransaction('888', 1500)

    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.payrexx.com/v1.0/Transaction/888/refund?instance=revampit-test')
    expect(init.method).toBe('POST')
    expect(init.body).toContain('amount=1500')
  })
})
