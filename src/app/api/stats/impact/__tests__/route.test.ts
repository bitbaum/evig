/**
 * @jest-environment node
 *
 * Tests for GET /api/stats/impact
 *
 * Mission-relevant: the impact stats (devices, CO2 savings, repairs, users)
 * appear on the public homepage as transparency data. Wrong numbers or broken
 * responses undermine donor and volunteer trust.
 *
 * Behaviors locked:
 *   GET /api/stats/impact
 *   - returns 200 with devices, co2, repairs, users fields
 *   - converts string counts to numbers
 *   - computes CO2 saved from sold listings via the estimateCO2Savings SSOT
 *     (the unified `listings` table already includes RevampIT shop stock via
 *     is_revampit=true — no separate marketplace_listings count)
 *   - returns 500 when any DB query throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockQuery = jest.fn()

jest.mock('@/lib/auth/db', () => ({
  query: (...args: unknown[]) => mockQuery.apply(null, args),
}))

jest.mock('@/config/co2-impact', () => ({
  // SSOT function: 20 kg per sold laptop, no claim for unknown categories.
  estimateCO2Savings: (category: string) => (category === 'laptop' ? 20 : null),
}))

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { SOLD: 'sold', REMOVED: 'removed' },
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: {
    LISTINGS: 'listings',
    IT_HILFE_REQUESTS: 'it_hilfe_requests',
    USERS: 'users',
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => ({
  apiSuccessCached: (data: unknown) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: true, data })
  },
  apiError: (err: unknown, msg: string, status = 500) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status })
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { GET } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// listingRows: 10 sold laptops, 3 non-sold (RevampIT shop stock is already in
//              `listings` via is_revampit=true — no separate shop query)
// repairRows: 25 repairs
// userRows:   100 users
const LISTING_ROWS = [
  { category: 'laptop', status: 'sold', count: '10' },
  { category: 'laptop', status: 'available', count: '3' },
]
const REPAIR_ROWS = [{ count: '25' }]
const USER_ROWS = [{ count: '100' }]

function setupQueryMocks() {
  mockQuery
    .mockResolvedValueOnce({ rows: LISTING_ROWS }) // listings
    .mockResolvedValueOnce({ rows: REPAIR_ROWS })  // repairs
    .mockResolvedValueOnce({ rows: USER_ROWS })    // users
}

beforeEach(() => {
  jest.clearAllMocks()
  setupQueryMocks()
})

// ============================================================================
// GET /api/stats/impact
// ============================================================================

describe('GET /api/stats/impact — success', () => {
  it('returns 200', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
  })

  it('returns success: true', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('counts total devices from all listing rows', async () => {
    const response = await GET()
    const body = await response.json()
    // 10 sold + 3 available = 13
    expect(body.data.devices.total).toBe(13)
  })

  it('counts sold devices from listings', async () => {
    const response = await GET()
    const body = await response.json()
    // 10 sold from listings (RevampIT shop stock included via is_revampit)
    expect(body.data.devices.sold).toBe(10)
  })

  it('computes CO2 from sold listings using category weight', async () => {
    const response = await GET()
    const body = await response.json()
    // listings: 10 sold laptops × 20 kg (SSOT mock) = 200
    expect(body.data.co2.savedKg).toBe(200)
  })

  it('converts CO2 kg to tons', async () => {
    const response = await GET()
    const body = await response.json()
    // 200 kg → 0.2 tons (rounded to 1dp)
    expect(body.data.co2.savedTons).toBe(0.2)
  })

  it('returns repair count as number', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.data.repairs).toBe(25)
  })

  it('returns user count as number', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.data.users).toBe(100)
  })

  it('handles empty listing rows (zero devices and CO2)', async () => {
    mockQuery.mockReset()
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })

    const response = await GET()
    const body = await response.json()
    expect(body.data.devices.total).toBe(0)
    expect(body.data.co2.savedKg).toBe(0)
  })

  it('claims NO CO₂ for categories without a defensible factor', async () => {
    mockQuery.mockReset()
    mockQuery
      .mockResolvedValueOnce({ rows: [{ category: 'unknown-thing', status: 'sold', count: '4' }] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })

    const response = await GET()
    const body = await response.json()
    // Conservative under-count: no factor → no claim (devices still counted).
    expect(body.data.co2.savedKg).toBe(0)
    expect(body.data.devices.sold).toBe(4)
  })

  it('includes meta.source = "database"', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.data.meta.source).toBe('database')
  })
})

describe('GET /api/stats/impact — DB error', () => {
  it('returns 500 when query throws', async () => {
    mockQuery.mockReset()
    mockQuery.mockRejectedValueOnce(new Error('DB connection lost'))
    const response = await GET()
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})
