/**
 * @jest-environment node
 *
 * Tests for GET /api/listings/mine
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext)
      }),
  parsePagination: () => ({ limit: 20, offset: 0, page: 1 }),
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockOffset = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    parsePagination: () => ({ limit: 20, offset: 0, page: 1 }),
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
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}))

jest.mock('@/db/schema', () => ({
  listings: {
    id: 'l_id', sellerId: 'l_sellerId', title: 'l_title', status: 'l_status',
    priceChf: 'l_priceChf', category: 'l_category', condition: 'l_condition',
    viewCount: 'l_viewCount', favoriteCount: 'l_favoriteCount',
    createdAt: 'l_createdAt', updatedAt: 'l_updatedAt',
  },
}))

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_ROW = {
  _total: 1,
  id: 'listing-1',
  title: 'Dell Laptop',
  price_chf: '350',
  category: 'laptops',
  condition: 'good',
  status: 'active',
  view_count: 10,
  favorite_count: 2,
  created_at: new Date('2025-01-01'),
  updated_at: new Date('2025-01-01'),
  thumbnail: null,
}

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'))
}

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockFrom.mockReturnValue({ where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOffset.mockResolvedValue([])
})

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/listings/mine', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await GET(makeRequest('http://localhost:3000/api/listings/mine'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('returns 200 with items array when listings exist', async () => {
    mockOffset.mockResolvedValue([MOCK_ROW])

    const res = await GET(makeRequest('http://localhost:3000/api/listings/mine'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.items).toHaveLength(1)
    expect(body.data.items[0]).not.toHaveProperty('_total')
    expect(body.data.items[0].id).toBe('listing-1')
    expect(body.data.total).toBe(1)
    expect(body.data.page).toBe(1)
  })

  it('returns 200 with empty items when user has no listings', async () => {
    mockOffset.mockResolvedValue([])

    const res = await GET(makeRequest('http://localhost:3000/api/listings/mine'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.items).toHaveLength(0)
    expect(body.data.total).toBe(0)
  })

  it('applies status filter when valid status query param is provided', async () => {
    mockOffset.mockResolvedValue([MOCK_ROW])

    const res = await GET(makeRequest('http://localhost:3000/api/listings/mine?status=active'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    // Verify db.select was called (chain was traversed)
    expect(mockSelect).toHaveBeenCalled()
    expect(mockFrom).toHaveBeenCalled()
  })

  it('strips _total from each item in the response', async () => {
    mockOffset.mockResolvedValue([MOCK_ROW, { ...MOCK_ROW, id: 'listing-2', _total: 2 }])

    const res = await GET(makeRequest('http://localhost:3000/api/listings/mine'))
    const body = await res.json()

    expect(body.data.items).toHaveLength(2)
    body.data.items.forEach((item: Record<string, unknown>) => {
      expect(item).not.toHaveProperty('_total')
    })
  })
})
