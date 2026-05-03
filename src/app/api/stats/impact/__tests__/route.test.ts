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
 *   - computes CO2 saved from sold listings using category weight × CO2_PER_KG
 *   - adds RevampIT direct shop sales at 2.5 kg fallback weight
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
  CATEGORY_WEIGHT_KG: { laptop: 2.0, desktop: 5.0 },
  CO2_PER_KG: 10,
  AVG_DEVICE_WEIGHT_KG: 2.5,
  FALLBACK_DEVICE_WEIGHT_KG: 2.0,
}))

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { SOLD: 'sold', REMOVED: 'removed' },
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: {
    LISTINGS: 'listings',
    IT_HILFE_REQUESTS: 'it_hilfe_requests',
    USERS: 'users',
    MARKETPLACE_LISTINGS: 'marketplace_listings',
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

// listingRows: 10 sold laptops, 3 non-sold
// repairRows: 25 repairs
// userRows:   100 users
// shopRows:   5 shop items sold
const LISTING_ROWS = [
  { category: 'laptop', status: 'sold', count: '10' },
  { category: 'laptop', status: 'available', count: '3' },
]
const REPAIR_ROWS = [{ count: '25' }]
const USER_ROWS = [{ count: '100' }]
const SHOP_ROWS = [{ count: '5' }]

function setupQueryMocks() {
  mockQuery
    .mockResolvedValueOnce({ rows: LISTING_ROWS }) // listings
    .mockResolvedValueOnce({ rows: REPAIR_ROWS })  // repairs
    .mockResolvedValueOnce({ rows: USER_ROWS })    // users
    .mockResolvedValueOnce({ rows: SHOP_ROWS })    // shop
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

  it('counts sold devices (listings + shop)', async () => {
    const response = await GET()
    const body = await response.json()
    // 10 from listings + 5 from shop
    expect(body.data.devices.sold).toBe(15)
  })

  it('computes CO2 from sold listings using category weight', async () => {
    const response = await GET()
    const body = await response.json()
    // listings: 10 × 2.0 kg × 10 CO2_PER_KG = 200
    // shop: 5 × 2.5 kg × 10 CO2_PER_KG = 125
    expect(body.data.co2.savedKg).toBe(325)
  })

  it('converts CO2 kg to tons', async () => {
    const response = await GET()
    const body = await response.json()
    // 325 kg → 0.3 tons (rounded to 1dp)
    expect(body.data.co2.savedTons).toBe(0.3)
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
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })

    const response = await GET()
    const body = await response.json()
    expect(body.data.devices.total).toBe(0)
    expect(body.data.co2.savedKg).toBe(0)
  })

  it('uses 2.0 kg fallback weight for unknown categories', async () => {
    mockQuery.mockReset()
    mockQuery
      .mockResolvedValueOnce({ rows: [{ category: 'unknown-thing', status: 'sold', count: '4' }] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })

    const response = await GET()
    const body = await response.json()
    // 4 × 2.0 fallback × 10 CO2_PER_KG = 80
    expect(body.data.co2.savedKg).toBe(80)
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
