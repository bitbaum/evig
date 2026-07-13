/**
 * @jest-environment node
 *
 * Tests for GET /api/sellers/[id] (public)
 *
 * Behaviors locked:
 *   GET - 404 (profile not found), 200 (with profile + listings + review_stats)
 */

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  sellerProfiles: {
    userId: 'sp_userId',
    displayName: 'sp_displayName',
    bio: 'sp_bio',
    avatarUrl: 'sp_avatarUrl',
    isVerified: 'sp_isVerified',
    createdAt: 'sp_createdAt',
  },
  listings: {
    id: 'l_id',
    title: 'l_title',
    priceChf: 'l_priceChf',
    category: 'l_category',
    condition: 'l_condition',
    brand: 'l_brand',
    model: 'l_model',
    createdAt: 'l_createdAt',
    sellerId: 'l_sellerId',
    status: 'l_status',
  },
  users: {
    id: 'u_id',
    name: 'u_name',
  },
  userProfiles: {
    userId: 'up_userId',
    displayName: 'up_displayName',
    bio: 'up_bio',
    avatarUrl: 'up_avatarUrl',
    isVerified: 'up_isVerified',
  },
  reviews: {
    id: 'r_id',
    targetType: 'r_targetType',
    targetId: 'r_targetId',
    status: 'r_status',
    overallRating: 'r_overallRating',
    reviewerId: 'r_reviewerId',
    title: 'r_title',
    content: 'r_content',
    createdAt: 'r_createdAt',
    isVerifiedPurchase: 'r_isVerifiedPurchase',
  },
  reviewResponses: {
    reviewId: 'rr_reviewId',
    content: 'rr_content',
    createdAt: 'rr_createdAt',
    status: 'rr_status',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  getTableName: (_table: unknown) => 'reviews',
}))

jest.mock('@/config/database', () => ({
  REVIEW_TARGET_TYPES: { LISTING: 'listing', USER: 'user' },
}))

jest.mock('@/config/review-status', () => ({
  REVIEW_STATUS: { PUBLISHED: 'published', PENDING_MODERATION: 'pending_moderation', HIDDEN: 'hidden', DELETED: 'deleted' },
}))

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { ACTIVE: 'active', DRAFT: 'draft', SOLD: 'sold', REMOVED: 'removed' },
}))

jest.mock('@/lib/marketplace/listing-helpers', () => ({
  listingThumbnailSubquery: { __sql: true, __isSubquery: true },
}))

jest.mock('@/lib/services/seller-service', () => ({
  sellerProfileCoreFields: {
    userId: 'sp_userId',
    displayName: 'sp_displayName',
    bio: 'sp_bio',
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccessCached: (data: unknown, _maxAge?: number, _stale?: number) =>
      NextResponse.json({ success: true, data }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (resource: string) =>
      NextResponse.json({ success: false, error: `${resource} not found` }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_PROFILE = {
  userId: 'seller-1',
  displayName: 'Test Seller',
  bio: 'Selling great tech',
  user_name: 'Test User',
}

const MOCK_LISTINGS = [
  {
    id: 'listing-1',
    title: 'ThinkPad X1',
    price_chf: '300',
    category: '1',
    condition: 'good',
    brand: 'Lenovo',
    model: 'X1',
    created_at: new Date(),
    thumbnail: null,
  },
]

const MOCK_REVIEW_STATS = {
  rows: [{ avg_rating: '4.5', review_count: '10' }],
}

function makeSelectChain(result: unknown[]) {
  const where = jest.fn().mockResolvedValue(result)
  const leftJoin = jest.fn().mockReturnValue({ where })
  const innerJoin = jest.fn().mockReturnValue({ leftJoin, where })
  const from = jest.fn().mockReturnValue({ innerJoin, where })
  return { from, innerJoin, leftJoin, where }
}

// histogram: from().innerJoin().where().groupBy()
function histogramChain(rows: unknown[]) {
  const groupBy = jest.fn().mockResolvedValue(rows)
  const where = jest.fn().mockReturnValue({ groupBy })
  const innerJoin = jest.fn().mockReturnValue({ where })
  const from = jest.fn().mockReturnValue({ innerJoin })
  return { from }
}

// reviews: from().innerJoin().innerJoin().leftJoin().where().orderBy().limit()
function reviewsChain(rows: unknown[]) {
  const limit = jest.fn().mockResolvedValue(rows)
  const orderBy = jest.fn().mockReturnValue({ limit })
  const where = jest.fn().mockReturnValue({ orderBy })
  const leftJoin = jest.fn().mockReturnValue({ where })
  const innerJoinInner = jest.fn().mockReturnValue({ leftJoin })
  const innerJoinOuter = jest.fn().mockReturnValue({ innerJoin: innerJoinInner })
  const from = jest.fn().mockReturnValue({ innerJoin: innerJoinOuter })
  return { from }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockExecute.mockResolvedValue(MOCK_REVIEW_STATS)
})

// ============================================================================
// GET — profile not found
// ============================================================================

describe('GET /api/sellers/[id] — profile not found', () => {
  it('returns 404 when seller profile does not exist', async () => {
    // First select: profile query returns empty
    const chain1 = makeSelectChain([])
    // Second select: listings query returns empty
    const chain2 = {
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([]),
        }),
      }),
    }
    mockSelect.mockReturnValueOnce(chain1).mockReturnValueOnce(chain2)

    const req = new NextRequest('http://localhost/api/sellers/nonexistent')
    const response = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

// ============================================================================
// GET — success
// ============================================================================

describe('GET /api/sellers/[id] — success', () => {
  it('returns 200 with profile, listings, and review stats', async () => {
    // First select: profile query
    const profileWhere = jest.fn().mockResolvedValue([MOCK_PROFILE])
    const profileLeftJoin = jest.fn().mockReturnValue({ where: profileWhere })
    const profileInnerJoin = jest.fn().mockReturnValue({ leftJoin: profileLeftJoin })
    const profileFrom = jest.fn().mockReturnValue({ innerJoin: profileInnerJoin })
    const chain1 = { from: profileFrom }

    // Second select: listings query
    const listingsOrderBy = jest.fn().mockResolvedValue(MOCK_LISTINGS)
    const listingsWhere = jest.fn().mockReturnValue({ orderBy: listingsOrderBy })
    const listingsFrom = jest.fn().mockReturnValue({ where: listingsWhere })
    const chain2 = { from: listingsFrom }

    mockSelect
      .mockReturnValueOnce(chain1)
      .mockReturnValueOnce(chain2)
      .mockReturnValueOnce(histogramChain([{ rating: 5, count: '7' }, { rating: 4, count: '3' }]))
      .mockReturnValueOnce(reviewsChain([
        { id: 'rev-1', rating: 5, title: 'Top', content: 'Super', created_at: new Date().toISOString(), is_verified_purchase: true, reviewer_name: 'Buyer', listing_id: 'listing-1', listing_title: 'ThinkPad X1', response_content: null, response_created_at: null },
      ]))

    const req = new NextRequest('http://localhost/api/sellers/seller-1')
    const response = await GET(req, { params: Promise.resolve({ id: 'seller-1' }) })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.profile.displayName).toBe('Test Seller')
    expect(body.data.listings).toHaveLength(1)
    // avg + total are derived from the histogram (5×7 + 4×3) / 10 = 4.7
    expect(body.data.review_stats.average_rating).toBe(4.7)
    expect(body.data.review_stats.total_reviews).toBe(10)
    expect(body.data.review_stats.histogram['5']).toBe(7)
    expect(body.data.reviews).toHaveLength(1)
    expect(body.data.reviews[0].is_verified_purchase).toBe(true)
  })

  it('returns 200 with zero review stats when no reviews', async () => {
    // First select: profile query
    const profileWhere = jest.fn().mockResolvedValue([MOCK_PROFILE])
    const profileLeftJoin = jest.fn().mockReturnValue({ where: profileWhere })
    const profileInnerJoin = jest.fn().mockReturnValue({ leftJoin: profileLeftJoin })
    const profileFrom = jest.fn().mockReturnValue({ innerJoin: profileInnerJoin })
    const chain1 = { from: profileFrom }

    // Second select: listings query — empty
    const listingsOrderBy = jest.fn().mockResolvedValue([])
    const listingsWhere = jest.fn().mockReturnValue({ orderBy: listingsOrderBy })
    const listingsFrom = jest.fn().mockReturnValue({ where: listingsWhere })
    const chain2 = { from: listingsFrom }

    mockSelect
      .mockReturnValueOnce(chain1)
      .mockReturnValueOnce(chain2)
      .mockReturnValueOnce(histogramChain([]))
      .mockReturnValueOnce(reviewsChain([]))

    // No review stats
    mockExecute.mockResolvedValueOnce({ rows: [{ avg_rating: null, review_count: '0' }] })

    const req = new NextRequest('http://localhost/api/sellers/seller-1')
    const response = await GET(req, { params: Promise.resolve({ id: 'seller-1' }) })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.review_stats.average_rating).toBe(0)
    expect(body.data.review_stats.total_reviews).toBe(0)
  })
})

// ============================================================================
// GET — missing id
// ============================================================================

describe('GET /api/sellers/[id] — missing id', () => {
  it('returns 404 when no id in params', async () => {
    const req = new NextRequest('http://localhost/api/sellers/')
    const response = await GET(req, { params: Promise.resolve({ id: '' }) })
    expect(response.status).toBe(404)
  })
})
