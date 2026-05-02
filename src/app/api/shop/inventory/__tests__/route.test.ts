/**
 * @jest-environment node
 *
 * Tests for GET /api/shop/inventory
 *
 * Mission-relevant: this is the public shop API. If input validation is
 * broken, arbitrary data reaches the service layer. If the error path
 * doesn't return a proper response, broken fetches crash the shop page.
 *
 * Behaviors locked:
 *   GET /api/shop/inventory
 *   - returns 200 with products and meta on success
 *   - validates query params with Zod (returns 400 on invalid limit)
 *   - passes validated params to getInventoryProducts
 *   - defaults limit=50 and offset=0 when omitted
 *   - accepts optional category, search, profile params
 *   - returns error response when service throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetInventoryProducts = jest.fn()

jest.mock('@/lib/services/inventory-service', () => ({
  getInventoryProducts: (...args: unknown[]) => mockGetInventoryProducts.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => ({
  apiSuccessCached: (data: unknown) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: true, data })
  },
  apiError: (err: unknown, msg: string) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  },
  apiBadRequest: (msg: string) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status: 400 })
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/shop/inventory')
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val)
  }
  return new NextRequest(url.toString())
}

const MOCK_RESULT = {
  products: [
    { id: 'prod-1', name: 'ThinkPad T14', price: 350 },
  ],
  total: 1,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetInventoryProducts.mockResolvedValue(MOCK_RESULT)
})

// ============================================================================
// GET /api/shop/inventory
// ============================================================================

describe('GET /api/shop/inventory', () => {
  it('returns 200 on success', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
  })

  it('returns success: true with product data', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.products).toHaveLength(1)
  })

  it('passes default limit=50 and offset=0 when not provided', async () => {
    await GET(makeRequest())
    expect(mockGetInventoryProducts).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50, offset: 0 }),
    )
  })

  it('passes provided limit and offset to service', async () => {
    await GET(makeRequest({ limit: '20', offset: '40' }))
    expect(mockGetInventoryProducts).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, offset: 40 }),
    )
  })

  it('passes optional category param to service', async () => {
    await GET(makeRequest({ category: 'laptops' }))
    expect(mockGetInventoryProducts).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'laptops' }),
    )
  })

  it('passes optional search param to service', async () => {
    await GET(makeRequest({ search: 'thinkpad' }))
    expect(mockGetInventoryProducts).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'thinkpad' }),
    )
  })

  it('returns 400 for invalid limit (non-numeric)', async () => {
    const response = await GET(makeRequest({ limit: 'abc' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 for limit exceeding max (>200)', async () => {
    const response = await GET(makeRequest({ limit: '999' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 for negative offset', async () => {
    const response = await GET(makeRequest({ offset: '-1' }))
    expect(response.status).toBe(400)
  })

  it('returns 500 error response when service throws', async () => {
    mockGetInventoryProducts.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(response.status).toBe(500)
  })
})
