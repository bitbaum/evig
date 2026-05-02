/**
 * @jest-environment node
 *
 * Tests for GET /api/org-numbers
 *
 * Mission-relevant: org numbers (impact, social, economic stats) appear on
 * the public homepage and in grant applications. If the fallback to defaults
 * is broken, the page shows no stats; if validation fails, arbitrary strings
 * reach the service layer.
 *
 * Behaviors locked:
 *   GET /api/org-numbers
 *   - returns 200 with items from DB when available
 *   - falls back to static defaults when DB returns empty array
 *   - filters by category when category param is valid
 *   - returns 400 when category param is invalid
 *   - returns 500 on unexpected error
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetOrgNumbers = jest.fn()

jest.mock('@/lib/org-numbers', () => ({
  getOrgNumbers: (...args: unknown[]) => mockGetOrgNumbers.apply(null, args),
  ORG_NUMBERS_DEFAULTS: {
    'impact-devices': { key: 'devices_recycled', category: 'impact', value: 500, unit: 'Geräte', label: 'Recycelte Geräte' },
    'social-volunteers': { key: 'volunteers', category: 'social', value: 80, unit: 'Personen', label: 'Freiwillige' },
    'impact-co2': { key: 'co2_saved', category: 'impact', value: 12, unit: 'Tonnen', label: 'CO₂ gespart' },
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
  apiBadRequest: (msg: string) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status: 400 })
  },
  apiError: (err: unknown, msg: string, status = 500) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status })
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DB_NUMBERS = [
  { key: 'devices_recycled', category: 'impact', value: 600, unit: 'Geräte', label: 'Recycelte Geräte' },
  { key: 'co2_saved', category: 'impact', value: 15, unit: 'Tonnen', label: 'CO₂ gespart' },
]

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/org-numbers')
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val)
  }
  return new NextRequest(url.toString())
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetOrgNumbers.mockResolvedValue(DB_NUMBERS)
})

// ============================================================================
// GET /api/org-numbers
// ============================================================================

describe('GET /api/org-numbers — success from DB', () => {
  it('returns 200 with items from DB', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
  })

  it('returns success: true', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('returns items array from DB', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.items).toHaveLength(2)
    expect(body.data.meta.source).toBe('database')
  })

  it('passes category param to getOrgNumbers', async () => {
    await GET(makeRequest({ category: 'impact' }))
    expect(mockGetOrgNumbers).toHaveBeenCalledWith('impact')
  })

  it('calls getOrgNumbers with undefined when no category', async () => {
    await GET(makeRequest())
    expect(mockGetOrgNumbers).toHaveBeenCalledWith(undefined)
  })
})

describe('GET /api/org-numbers — fallback to defaults', () => {
  it('returns defaults when DB returns empty array', async () => {
    mockGetOrgNumbers.mockResolvedValueOnce([])
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.meta.source).toBe('defaults')
    expect(body.data.items.length).toBeGreaterThan(0)
  })

  it('filters defaults by category when specified and DB is empty', async () => {
    mockGetOrgNumbers.mockResolvedValueOnce([])
    const response = await GET(makeRequest({ category: 'impact' }))
    const body = await response.json()
    // Should only include impact defaults
    expect(body.data.items.every((n: { category: string }) => n.category === 'impact')).toBe(true)
  })
})

describe('GET /api/org-numbers — validation', () => {
  it('returns 400 for unknown category', async () => {
    const response = await GET(makeRequest({ category: 'invalid-cat' }))
    expect(response.status).toBe(400)
  })

  it.each(['impact', 'social', 'economic', 'operations'])(
    'accepts valid category "%s"',
    async (cat) => {
      const response = await GET(makeRequest({ category: cat }))
      expect(response.status).toBe(200)
    },
  )
})

describe('GET /api/org-numbers — error', () => {
  it('returns 500 when getOrgNumbers throws', async () => {
    mockGetOrgNumbers.mockRejectedValueOnce(new Error('DB timeout'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})
