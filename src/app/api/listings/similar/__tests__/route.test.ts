/**
 * @jest-environment node
 *
 * Tests for GET /api/listings/similar
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockSelect = jest.fn()
const mockFrom1 = jest.fn()
const mockWhere1 = jest.fn()
const mockFrom2 = jest.fn()
const mockWhere2 = jest.fn()
const mockOrderBy2 = jest.fn()
const mockLimit2 = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccessCached: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
    parsePagination: () => ({ limit: 4, offset: 0, page: 1 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/marketplace/listing-helpers', () => ({
  listingThumbnailSubquery: { __sql: 'thumbnail_subquery' },
}))

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { ACTIVE: 'active', REMOVED: 'removed', DRAFT: 'draft', SOLD: 'sold' },
  LISTING_STATUSES: ['active', 'removed', 'draft', 'sold'],
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
  desc: (a: unknown) => ({ __desc: a }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}))

jest.mock('@/db/schema', () => ({
  listings: {
    id: 'l_id', sellerId: 'l_sellerId', title: 'l_title', status: 'l_status',
    priceChf: 'l_priceChf', category: 'l_category', condition: 'l_condition',
    viewCount: 'l_viewCount', favoriteCount: 'l_favoriteCount', createdAt: 'l_createdAt',
  },
}))

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_SOURCE = { category: 'laptops', priceChf: '400' }

const MOCK_SIMILAR = {
  id: 'listing-2',
  title: 'Lenovo Laptop',
  price_chf: '380',
  category: 'laptops',
  condition: 'good',
  view_count: 8,
  favorite_count: 1,
  created_at: new Date('2025-01-01'),
  thumbnail: null,
}

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'))
}

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.resetAllMocks()

  // Default: two separate select chains
  mockFrom1.mockReturnValue({ where: mockWhere1 })
  mockWhere1.mockResolvedValue([])

  mockFrom2.mockReturnValue({ where: mockWhere2 })
  mockWhere2.mockReturnValue({ orderBy: mockOrderBy2 })
  mockOrderBy2.mockReturnValue({ limit: mockLimit2 })
  mockLimit2.mockResolvedValue([])

  // Wire mockSelect to return different chains on successive calls
  mockSelect
    .mockReturnValueOnce({ from: mockFrom1 })
    .mockReturnValueOnce({ from: mockFrom2 })
})

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/listings/similar', () => {
  it('returns 400 when listing_id is missing', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/listings/similar'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/listing_id/)
  })

  it('returns 200 with empty array when source listing is not found', async () => {
    // First select returns nothing
    mockWhere1.mockResolvedValue([])

    const res = await GET(makeRequest('http://localhost:3000/api/listings/similar?listing_id=unknown-id'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
    // Should not call second select at all
    expect(mockSelect).toHaveBeenCalledTimes(1)
  })

  it('returns 200 with similar listings when source exists', async () => {
    mockWhere1.mockResolvedValue([MOCK_SOURCE])
    mockLimit2.mockResolvedValue([MOCK_SIMILAR])

    const res = await GET(makeRequest('http://localhost:3000/api/listings/similar?listing_id=listing-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('listing-2')
    expect(mockSelect).toHaveBeenCalledTimes(2)
  })

  it('returns 200 with empty array when no similar listings exist in same category', async () => {
    mockWhere1.mockResolvedValue([MOCK_SOURCE])
    mockLimit2.mockResolvedValue([])

    const res = await GET(makeRequest('http://localhost:3000/api/listings/similar?listing_id=listing-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(0)
  })
})
