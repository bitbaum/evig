/**
 * @jest-environment node
 *
 * Tests for GET /api/stats/community
 *
 * Mission-relevant: the homepage and marketing pages display live community
 * stats (user count, active listings, repairs, workshops). If the route
 * returns zeros instead of real counts, it looks like the platform is empty
 * and undermines donor/volunteer confidence.
 *
 * Behaviors locked:
 *   GET /api/stats/community
 *   - returns 200 with users, listings, repairs, workshops as numbers
 *   - counts come from the DB query results
 *   - returns zeros when DB rows have null count values
 *   - returns 500-level JSON error when DB query throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockQuery = jest.fn()

jest.mock('@/lib/auth/db', () => ({
  query: (...args: unknown[]) => mockQuery.apply(null, args),
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: {
    USERS: 'users',
    MARKETPLACE_LISTINGS: 'marketplace_listings',
    IT_HILFE_REQUESTS: 'it_hilfe_requests',
    WORKSHOPS: 'workshops',
  },
}))

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { ACTIVE: 'active' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// apiSuccessCached / apiError need NextResponse — mock them with real NextResponse
jest.mock('@/lib/api/helpers', () => ({
  apiSuccessCached: (data: unknown) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: true, data })
  },
  apiError: (err: unknown, msg: string) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { GET } from '../route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQueryResult(count: string | null) {
  return { rows: [{ count }] }
}

beforeEach(() => {
  jest.clearAllMocks()
  // Default: all queries return meaningful counts
  mockQuery
    .mockResolvedValueOnce(makeQueryResult('42'))   // users
    .mockResolvedValueOnce(makeQueryResult('15'))   // listings
    .mockResolvedValueOnce(makeQueryResult('8'))    // repairs
    .mockResolvedValueOnce(makeQueryResult('3'))    // workshops
})

// ============================================================================
// GET /api/stats/community
// ============================================================================

describe('GET /api/stats/community', () => {
  it('returns 200 status', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
  })

  it('returns numeric user count from DB', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.data.users).toBe(42)
  })

  it('returns numeric listings count from DB', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.data.listings).toBe(15)
  })

  it('returns numeric repairs count from DB', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.data.repairs).toBe(8)
  })

  it('returns numeric workshops count from DB', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.data.workshops).toBe(3)
  })

  it('returns 0 when DB count is null (no rows)', async () => {
    mockQuery.mockReset()
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: null }] })
      .mockResolvedValueOnce({ rows: [{ count: null }] })
      .mockResolvedValueOnce({ rows: [{ count: null }] })
      .mockResolvedValueOnce({ rows: [{ count: null }] })

    const response = await GET()
    const body = await response.json()
    expect(body.data.users).toBe(0)
    expect(body.data.listings).toBe(0)
  })

  it('returns 0 when DB returns empty rows array', async () => {
    mockQuery.mockReset()
    mockQuery.mockResolvedValue({ rows: [] })

    const response = await GET()
    const body = await response.json()
    expect(body.data.users).toBe(0)
  })

  it('returns error response when DB throws', async () => {
    mockQuery.mockReset()
    mockQuery.mockRejectedValue(new Error('Connection timeout'))

    const response = await GET()
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(response.status).toBe(500)
  })
})
