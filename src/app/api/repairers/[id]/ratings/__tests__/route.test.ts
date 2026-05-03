/**
 * @jest-environment node
 *
 * Tests for GET /api/repairers/[id]/ratings (public)
 *
 * Behaviors locked:
 *   GET - 404 (repairer not found), 200 with ratings
 */

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockInnerJoin = jest.fn()
const mockLeftJoin = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockGroupBy = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  repairerProfiles: {
    id: 'rp_id',
    businessName: 'rp_businessName',
    averageRating: 'rp_averageRating',
    totalReviews: 'rp_totalReviews',
    isVerified: 'rp_isVerified',
  },
  reviews: {
    id: 'rv_id',
    overallRating: 'rv_overallRating',
    title: 'rv_title',
    content: 'rv_content',
    createdAt: 'rv_createdAt',
    isVerifiedPurchase: 'rv_isVerifiedPurchase',
    reviewerId: 'rv_reviewerId',
    targetType: 'rv_targetType',
    targetId: 'rv_targetId',
    status: 'rv_status',
  },
  reviewResponses: {
    id: 'rr_id',
    reviewId: 'rr_reviewId',
    content: 'rr_content',
    createdAt: 'rr_createdAt',
    status: 'rr_status',
  },
  users: { id: 'u_id', name: 'u_name' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  desc: (a: unknown) => ({ __desc: a }),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccessCached: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error' },
}))

jest.mock('@/config/api-defaults', () => ({
  API_DEFAULTS: { RECENT_RATINGS_LIMIT: 10 },
}))

jest.mock('@/config/database', () => ({
  REVIEW_TARGET_TYPES: { REPAIRER: 'repairer' },
}))

jest.mock('@/config/review-status', () => ({
  REVIEW_STATUS: { PUBLISHED: 'published' },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_PROFILE = {
  id: 'repairer-1',
  businessName: 'Fix-It Shop',
  averageRating: '4.5',
  totalReviews: 12,
}

const MOCK_REVIEW = {
  id: 'review-1',
  overallRating: 5,
  title: 'Great service',
  content: 'Very professional',
  createdAt: new Date('2024-01-01'),
  isVerifiedPurchase: true,
  reviewerName: 'John',
  responseContent: null,
  responseCreatedAt: null,
}

const MOCK_BREAKDOWN_ROW = { overallRating: 5, count: '10' }

function makeContext(id = 'repairer-1') {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(id = 'repairer-1') {
  return new NextRequest(`http://localhost/api/repairers/${id}/ratings`)
}

beforeEach(() => {
  jest.resetAllMocks()
  mockGroupBy.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockLimit.mockResolvedValue([MOCK_REVIEW])
  mockLeftJoin.mockReturnValue({ where: mockWhere })
  mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy, groupBy: mockGroupBy })
  mockFrom.mockReturnValue({ where: mockWhere, innerJoin: mockInnerJoin })
  mockSelect.mockReturnValue({ from: mockFrom })
})

describe('GET /api/repairers/[id]/ratings', () => {
  it('returns 404 when repairer not found', async () => {
    // First select: profile not found
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Reparateur nicht gefunden')
  })

  it('returns 200 with ratings overview and recent reviews', async () => {
    // 1. Profile select
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_PROFILE]),
      }),
    })
    // 2. Recent reviews (with innerJoin + leftJoin + orderBy + limit)
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([MOCK_REVIEW]),
              }),
            }),
          }),
        }),
      }),
    })
    // 3. Rating breakdown
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          groupBy: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([MOCK_BREAKDOWN_ROW]),
          }),
        }),
      }),
    })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.repairer.id).toBe('repairer-1')
    expect(body.data.ratings.overview.averageRating).toBe(4.5)
    expect(body.data.ratings.overview.totalReviews).toBe(12)
    expect(body.data.ratings.recentReviews).toHaveLength(1)
    expect(body.data.ratings.breakdown[5]).toBe(10)
  })

  it('returns 200 with zero averageRating when profile has null averageRating', async () => {
    // 1. Profile with null rating
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ ...MOCK_PROFILE, averageRating: null, totalReviews: 0 }]),
      }),
    })
    // 2. Recent reviews — empty
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      }),
    })
    // 3. Breakdown — empty
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          groupBy: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.ratings.overview.averageRating).toBe(0)
    expect(body.data.ratings.recentReviews).toHaveLength(0)
  })
})
