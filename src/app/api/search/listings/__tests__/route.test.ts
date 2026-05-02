/**
 * @jest-environment node
 *
 * Tests for GET /api/search/listings (public)
 *
 * Behaviors locked:
 *   GET - 400 (invalid query), 200 with fallback=true (meilisearch unavailable),
 *         200 with results (normal search)
 */

const mockSearchListings = jest.fn()

jest.mock('@/lib/search/meilisearch', () => ({
  searchListings: (...args: unknown[]) => mockSearchListings(...args),
}))

const mockValidateQuery = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateQuery: (...args: unknown[]) => mockValidateQuery(...args),
  ListingsQuerySchema: {},
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccessCached: (data: unknown, _maxAge?: number, _stale?: number) =>
      NextResponse.json({ success: true, data }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

const VALID_FILTERS = {
  limit: 20,
  offset: 0,
  search: '',
  sort: undefined,
  category: undefined,
  condition: undefined,
  delivery: undefined,
  payment: undefined,
  price_min: undefined,
  price_max: undefined,
  seller_type: undefined,
}

beforeEach(() => {
  jest.resetAllMocks()

  // Default: valid query
  mockValidateQuery.mockReturnValue({ success: true, data: VALID_FILTERS })
  mockSearchListings.mockResolvedValue(null)
})

// ============================================================================
// GET — query validation
// ============================================================================

describe('GET /api/search/listings — invalid query', () => {
  it('returns 400 when query params are invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server') as typeof import('next/server')
    mockValidateQuery.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Abfrageparameter' }, { status: 400 }),
    })

    const req = new NextRequest('http://localhost/api/search/listings?limit=notanumber')
    const response = await GET(req)
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// GET — Meilisearch unavailable (fallback)
// ============================================================================

describe('GET /api/search/listings — meilisearch unavailable', () => {
  it('returns 200 with fallback=true when searchListings returns null', async () => {
    mockSearchListings.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/search/listings?search=laptop')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.fallback).toBe(true)
    expect(body.data.items).toEqual([])
  })
})

// ============================================================================
// GET — successful search
// ============================================================================

describe('GET /api/search/listings — success', () => {
  it('returns 200 with search results', async () => {
    const mockHits = [
      { id: 'listing-1', title: 'ThinkPad T480', price_chf: 250 },
      { id: 'listing-2', title: 'Dell XPS 13', price_chf: 350 },
    ]
    mockSearchListings.mockResolvedValueOnce({
      hits: mockHits,
      estimatedTotalHits: 2,
      facetDistribution: { category: { laptops: 2 } },
    })

    const req = new NextRequest('http://localhost/api/search/listings?search=laptop')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.items).toHaveLength(2)
    expect(body.data.items[0].title).toBe('ThinkPad T480')
    expect(body.data.pagination.total).toBe(2)
    expect(body.data.facets).toBeDefined()
  })

  it('calls searchListings with correct params from query', async () => {
    mockValidateQuery.mockReturnValueOnce({
      success: true,
      data: { ...VALID_FILTERS, search: 'laptop', limit: 10, offset: 20 },
    })
    mockSearchListings.mockResolvedValueOnce({
      hits: [],
      estimatedTotalHits: 0,
      facetDistribution: null,
    })

    const req = new NextRequest('http://localhost/api/search/listings?search=laptop&limit=10&offset=20')
    await GET(req)

    expect(mockSearchListings).toHaveBeenCalledWith(
      'laptop',
      expect.objectContaining({}),
      undefined,
      3, // page = floor(20/10) + 1
      10
    )
  })
})
