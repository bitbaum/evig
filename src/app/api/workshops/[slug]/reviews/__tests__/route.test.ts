/**
 * @jest-environment node
 *
 * Tests for GET /api/workshops/[slug]/reviews (public)
 *
 * Behaviors locked:
 *   GET - 404 (workshop not found), 200 with reviews and stats
 */

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockInnerJoin = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  workshops: { id: 'w_id', slug: 'w_slug' },
  workshopRegistrations: {
    id: 'wr_id',
    userId: 'wr_userId',
    workshopInstanceId: 'wr_workshopInstanceId',
    rating: 'wr_rating',
    feedback: 'wr_feedback',
    createdAt: 'wr_createdAt',
  },
  workshopInstances: {
    id: 'wi_id',
    workshopId: 'wi_workshopId',
    startDate: 'wi_startDate',
  },
  users: { id: 'u_id', name: 'u_name' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  desc: (a: unknown) => ({ __desc: a }),
  isNotNull: (a: unknown) => ({ __isNotNull: a }),
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
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

jest.mock('@/config/api-defaults', () => ({
  API_DEFAULTS: { RECENT_REVIEWS_LIMIT: 20 },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_WORKSHOP = { id: 'workshop-1' }

const MOCK_REVIEW = {
  id: 'reg-1',
  user_name: 'Jane',
  rating: 5,
  feedback: 'Excellent!',
  created_at: new Date('2024-01-01'),
  instance_date: new Date('2023-12-15'),
}

const MOCK_STATS = {
  average_rating: '4.8',
  review_count: '5',
}

function makeContext(slug = 'linux-basics') {
  return { params: Promise.resolve({ slug }) }
}

function makeRequest(slug = 'linux-basics') {
  return new NextRequest(`http://localhost/api/workshops/${slug}/reviews`)
}

beforeEach(() => {
  jest.resetAllMocks()
})

describe('GET /api/workshops/[slug]/reviews', () => {
  it('returns 404 when workshop not found', async () => {
    // Workshop slug lookup returns empty
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Workshop')
  })

  it('returns 200 with reviews and stats', async () => {
    // 1. Workshop found
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_WORKSHOP]),
      }),
    })
    // 2. Reviews (with innerJoin x2 + where + orderBy + limit) — via Promise.all
    // 3. Stats (with innerJoin + where) — via Promise.all
    // Both use Promise.all internally
    const reviewsChain = {
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([MOCK_REVIEW]),
              }),
            }),
          }),
        }),
      }),
    }
    const statsChain = {
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([MOCK_STATS]),
        }),
      }),
    }
    mockSelect.mockReturnValueOnce(reviewsChain)
    mockSelect.mockReturnValueOnce(statsChain)

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.reviews).toHaveLength(1)
    expect(body.data.reviews[0].feedback).toBe('Excellent!')
    expect(body.data.stats.averageRating).toBe(4.8)
    expect(body.data.stats.reviewCount).toBe(5)
  })

  it('returns 200 with empty reviews and zero stats when none exist', async () => {
    // Workshop found
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_WORKSHOP]),
      }),
    })
    // Reviews — empty
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      }),
    })
    // Stats — empty / null
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ average_rating: null, review_count: '0' }]),
        }),
      }),
    })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.reviews).toHaveLength(0)
    expect(body.data.stats.averageRating).toBe(0)
    expect(body.data.stats.reviewCount).toBe(0)
  })
})
