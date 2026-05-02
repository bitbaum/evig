/**
 * @jest-environment node
 *
 * Tests for GET /api/public/financials
 *
 * Mission-relevant: public financial transparency is part of RevampIT's mission.
 * The yearly financial data is displayed on the public website to show donors
 * and stakeholders how funds are used. Broken data or broken responses erode trust.
 *
 * Behaviors locked:
 *   GET /api/public/financials
 *   - returns 200 with yearly financial data
 *   - filters null entries from the result
 *   - limits to 5 most recent years
 *   - returns 500 when financial loader throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetAvailableYears = jest.fn()
const mockLoadFinancialData = jest.fn()

jest.mock('@/lib/hirn/data/financial-loader', () => ({
  getAvailableYears: (...args: unknown[]) => mockGetAvailableYears.apply(null, args),
  loadFinancialData: (...args: unknown[]) => mockLoadFinancialData.apply(null, args),
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

function makeFinancialData(year: number) {
  return {
    year,
    totals: {
      total: { value: 500000 },
      warenverkauf: { value: 200000 },
      dienstleistungen: { value: 100000 },
      integration: { value: 50000 },
      spenden: { value: 100000 },
      aufstockung: { value: 50000 },
    },
    derived: {
      eigenfinanzierungPct: { value: 0.6 },
      earnedTotal: { value: 300000 },
      donationsTotal: { value: 200000 },
    },
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetAvailableYears.mockResolvedValue([2025, 2024, 2023, 2022, 2021, 2020])
  mockLoadFinancialData.mockImplementation((year: number) =>
    Promise.resolve(makeFinancialData(year))
  )
})

// ============================================================================
// GET /api/public/financials
// ============================================================================

describe('GET /api/public/financials — success', () => {
  it('returns 200', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
  })

  it('returns success: true', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('limits data to 5 most recent years', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.data).toHaveLength(5)
  })

  it('returns correctly shaped year objects', async () => {
    const response = await GET()
    const body = await response.json()
    const entry = body.data[0]
    expect(entry.year).toBe(2025)
    expect(typeof entry.totals.total).toBe('number')
    expect(typeof entry.derived.eigenfinanzierungPct).toBe('number')
  })

  it('rounds eigenfinanzierungPct to 1 decimal place', async () => {
    const response = await GET()
    const body = await response.json()
    // 0.6 * 10 rounded / 10 = 0.6
    expect(body.data[0].derived.eigenfinanzierungPct).toBe(0.6)
  })

  it('filters null entries (years with no data)', async () => {
    mockLoadFinancialData.mockImplementation((year: number) =>
      year === 2023 ? Promise.resolve(null) : Promise.resolve(makeFinancialData(year))
    )
    const response = await GET()
    const body = await response.json()
    expect(body.data.every((d: { year: number } | null) => d !== null)).toBe(true)
    expect(body.data.length).toBe(4) // 5 years - 1 null
  })

  it('returns empty array when no years are available', async () => {
    mockGetAvailableYears.mockResolvedValueOnce([])
    const response = await GET()
    const body = await response.json()
    expect(body.data).toEqual([])
  })
})

describe('GET /api/public/financials — error', () => {
  it('returns 500 when getAvailableYears throws', async () => {
    mockGetAvailableYears.mockRejectedValueOnce(new Error('file not found'))
    const response = await GET()
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })

  it('returns 500 when loadFinancialData throws', async () => {
    mockLoadFinancialData.mockRejectedValueOnce(new Error('parse error'))
    const response = await GET()
    expect(response.status).toBe(500)
  })
})
