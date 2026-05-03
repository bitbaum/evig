/**
 * @jest-environment node
 *
 * Tests for GET /api/payments/payrexx-mock-redirect
 *
 * Behaviors locked:
 *   GET - 403 when PAYREXX_INSTANCE is set (production block)
 *       - 200 with HTML page containing referenceId, amount, currency
 *       - currency defaults to CHF for unsupported values
 *       - amount is formatted from cents to CHF (e.g. 1999 → "19.99")
 */

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiForbidden: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 403 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/urls', () => ({
  APP_URL: 'http://localhost:3000',
}))

jest.mock('@/lib/payments/payrexx-client', () => ({
  PAYREXX_TRANSACTION_STATUS: { RESERVED: 'reserved', CONFIRMED: 'confirmed', CANCELLED: 'cancelled' },
}))

jest.mock('@/lib/utils/safe-redirect', () => ({
  sanitizeReturnTo: (val: string | null, fallback: string) => val || fallback,
}))

jest.mock('@/lib/utils/escape-html', () => ({
  escapeHtml: (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

beforeEach(() => {
  jest.resetAllMocks()
  delete process.env.PAYREXX_INSTANCE
})

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/payments/payrexx-mock-redirect')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return new NextRequest(url.toString())
}

// ============================================================================
// Production block
// ============================================================================

describe('GET /api/payments/payrexx-mock-redirect — production block', () => {
  it('returns 403 when PAYREXX_INSTANCE is set', async () => {
    process.env.PAYREXX_INSTANCE = 'myshop'
    const req = makeRequest({ referenceId: 'ref-1', amount: '1000', currency: 'CHF' })
    const response = await GET(req)
    expect(response.status).toBe(403)
  })
})

// ============================================================================
// Dev mode — HTML rendering
// ============================================================================

describe('GET /api/payments/payrexx-mock-redirect — dev mode', () => {
  it('returns 200 with HTML content type', async () => {
    const req = makeRequest({ referenceId: 'ref-123', amount: '1999', currency: 'CHF' })
    const response = await GET(req)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/html')
  })

  it('renders the referenceId in the HTML page', async () => {
    const req = makeRequest({ referenceId: 'ref-abc', amount: '500', currency: 'CHF' })
    const response = await GET(req)
    const html = await response.text()
    expect(html).toContain('ref-abc')
  })

  it('formats amount from cents to CHF display value', async () => {
    const req = makeRequest({ referenceId: 'ref-1', amount: '1999', currency: 'CHF' })
    const response = await GET(req)
    const html = await response.text()
    // 1999 cents = 19.99 CHF
    expect(html).toContain('19.99')
  })

  it('renders CHF currency by default', async () => {
    const req = makeRequest({ referenceId: 'ref-1', amount: '500' })
    const response = await GET(req)
    const html = await response.text()
    expect(html).toContain('CHF')
  })

  it('renders EUR when passed as currency', async () => {
    const req = makeRequest({ referenceId: 'ref-1', amount: '500', currency: 'EUR' })
    const response = await GET(req)
    const html = await response.text()
    expect(html).toContain('EUR')
  })

  it('falls back to CHF for unsupported currency', async () => {
    const req = makeRequest({ referenceId: 'ref-1', amount: '500', currency: 'USD' })
    const response = await GET(req)
    const html = await response.text()
    expect(html).toContain('CHF')
    expect(html).not.toContain('USD')
  })

  it('renders pay and cancel buttons', async () => {
    const req = makeRequest({ referenceId: 'ref-1', amount: '1000', currency: 'CHF' })
    const response = await GET(req)
    const html = await response.text()
    expect(html).toContain('handlePay')
    expect(html).toContain('handleCancel')
  })

  it('includes DEV MOCK badge in HTML', async () => {
    const req = makeRequest({ referenceId: 'ref-1', amount: '1000', currency: 'CHF' })
    const response = await GET(req)
    const html = await response.text()
    expect(html).toContain('DEV MOCK')
  })

  it('includes webhook URL in script', async () => {
    const req = makeRequest({ referenceId: 'ref-1', amount: '1000', currency: 'CHF' })
    const response = await GET(req)
    const html = await response.text()
    expect(html).toContain('payrexx-webhook')
  })
})
