/**
 * @jest-environment node
 *
 * Tests for GET /api/services
 *
 * Mission-relevant: this endpoint powers the public services page and booking
 * widget. If the wrong service set is returned (e.g. bookable=true but all
 * services returned), users see services they can't book.
 *
 * Behaviors locked:
 *   GET /api/services
 *   - returns 200 with featured services by default
 *   - returns bookable services when bookable=true
 *   - returns all services when all=true
 *   - strips React icon components from response (returns iconName string)
 *   - returns 500 when service throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetFeaturedServices = jest.fn()
const mockGetBookableServices = jest.fn()
const mockGetAllServices = jest.fn()

jest.mock('@/lib/services', () => ({
  getFeaturedServices: (...args: unknown[]) => mockGetFeaturedServices.apply(null, args),
  getBookableServices: (...args: unknown[]) => mockGetBookableServices.apply(null, args),
  getAllServices: (...args: unknown[]) => mockGetAllServices.apply(null, args),
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

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeService = (id: string, overrides = {}) => ({
  id,
  slug: `service-${id}`,
  name: `Service ${id}`,
  description: 'Test service',
  category: 'repair',
  hero: null,
  features: [
    {
      title: 'Feature',
      description: 'Desc',
      icon: { displayName: 'Wrench' },
    },
  ],
  process: [],
  pricing: null,
  priceCents: 1500,
  durationMinutes: 60,
  isBookable: true,
  isFeatured: true,
  displayOrder: 1,
  ...overrides,
})

const FEATURED_SERVICES = [makeService('featured-1'), makeService('featured-2')]
const BOOKABLE_SERVICES = [makeService('bookable-1')]
const ALL_SERVICES = [makeService('all-1'), makeService('all-2'), makeService('all-3')]

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/services')
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val)
  }
  return new NextRequest(url.toString())
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetFeaturedServices.mockResolvedValue(FEATURED_SERVICES)
  mockGetBookableServices.mockResolvedValue(BOOKABLE_SERVICES)
  mockGetAllServices.mockResolvedValue(ALL_SERVICES)
})

// ============================================================================
// GET /api/services
// ============================================================================

describe('GET /api/services — default (featured)', () => {
  it('returns 200 on success', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
  })

  it('calls getFeaturedServices by default', async () => {
    await GET(makeRequest())
    expect(mockGetFeaturedServices).toHaveBeenCalledTimes(1)
    expect(mockGetBookableServices).not.toHaveBeenCalled()
    expect(mockGetAllServices).not.toHaveBeenCalled()
  })

  it('returns 2 featured services', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data).toHaveLength(2)
  })

  it('includes iconName string (not React component) in features', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    const feature = body.data[0].features[0]
    expect(typeof feature.iconName).toBe('string')
    expect(feature.iconName).toBe('Wrench')
    expect(feature.icon).toBeUndefined()
  })
})

describe('GET /api/services — bookable=true', () => {
  it('calls getBookableServices when bookable=true', async () => {
    await GET(makeRequest({ bookable: 'true' }))
    expect(mockGetBookableServices).toHaveBeenCalledTimes(1)
    expect(mockGetFeaturedServices).not.toHaveBeenCalled()
  })

  it('returns bookable services', async () => {
    const response = await GET(makeRequest({ bookable: 'true' }))
    const body = await response.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('bookable-1')
  })
})

describe('GET /api/services — all=true', () => {
  it('calls getAllServices when all=true', async () => {
    await GET(makeRequest({ all: 'true' }))
    expect(mockGetAllServices).toHaveBeenCalledTimes(1)
    expect(mockGetFeaturedServices).not.toHaveBeenCalled()
  })

  it('returns all services', async () => {
    const response = await GET(makeRequest({ all: 'true' }))
    const body = await response.json()
    expect(body.data).toHaveLength(3)
  })
})

describe('GET /api/services — error', () => {
  it('returns 500 when getFeaturedServices throws', async () => {
    mockGetFeaturedServices.mockRejectedValueOnce(new Error('service unavailable'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})
