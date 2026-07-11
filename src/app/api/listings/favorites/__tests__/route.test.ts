/**
 * @jest-environment node
 *
 * Tests for GET /api/listings/favorites
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
const mockInnerJoin = jest.fn()
const mockLeftJoin = jest.fn()
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
    isRevampit: 'l_isRevampit', viewCount: 'l_viewCount', favoriteCount: 'l_favoriteCount',
    createdAt: 'l_createdAt', deliveryOptions: 'l_deliveryOptions',
    paymentMode: 'l_paymentMode', pickupLocation: 'l_pickupLocation',
  },
  listingFavorites: { id: 'lf_id', userId: 'lf_userId', listingId: 'lf_listingId', createdAt: 'lf_createdAt' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
  userProfiles: { userId: 'up_userId', displayName: 'up_displayName', bio: 'up_bio', avatarUrl: 'up_avatarUrl', isVerified: 'up_isVerified' },
  sellerProfiles: { id: 'sp_id', userId: 'sp_userId', displayName: 'sp_displayName', city: 'sp_city' },
}))

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_FAVORITE_ROW = {
  _total: 1,
  id: 'listing-1',
  title: 'Dell Laptop',
  price_chf: '350',
  category: 'laptops',
  condition: 'good',
  delivery_options: ['pickup'],
  payment_mode: 'cash',
  status: 'active',
  is_revampit: false,
  pickup_location: 'Zürich',
  view_count: 5,
  favorite_count: 3,
  created_at: new Date('2025-01-01'),
  seller_name: 'Seller',
  seller_display_name: null,
  seller_city: 'Bern',
  thumbnail: null,
  favorited_at: new Date('2025-02-01'),
}

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'))
}

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, leftJoin: mockLeftJoin, where: mockWhere })
  mockInnerJoin.mockReturnValue({ innerJoin: mockInnerJoin, leftJoin: mockLeftJoin, where: mockWhere })
  mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOffset.mockResolvedValue([])
})

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/listings/favorites', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await GET(makeRequest('http://localhost:3000/api/listings/favorites'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('returns 200 with items when favorites exist', async () => {
    mockOffset.mockResolvedValue([MOCK_FAVORITE_ROW])

    const res = await GET(makeRequest('http://localhost:3000/api/listings/favorites'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.items).toHaveLength(1)
    expect(body.data.items[0]).not.toHaveProperty('_total')
    expect(body.data.items[0].id).toBe('listing-1')
    expect(body.data.pagination.total).toBe(1)
  })

  it('returns 200 with empty items when user has no favorites', async () => {
    mockOffset.mockResolvedValue([])

    const res = await GET(makeRequest('http://localhost:3000/api/listings/favorites'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.items).toHaveLength(0)
    expect(body.data.pagination.total).toBe(0)
  })

  it('performs joins to fetch seller info', async () => {
    mockOffset.mockResolvedValue([])

    await GET(makeRequest('http://localhost:3000/api/listings/favorites'))

    expect(mockFrom).toHaveBeenCalled()
    expect(mockInnerJoin).toHaveBeenCalled()
    expect(mockLeftJoin).toHaveBeenCalled()
  })
})
