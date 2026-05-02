/**
 * @jest-environment node
 *
 * Tests for GET /api/listings/[id], PATCH /api/listings/[id], DELETE /api/listings/[id]
 *
 * Behaviors locked:
 *   GET  - 404 when listing not found
 *        - 200 with full listing data (no session → is_favorited: false)
 *        - 200 with is_favorited: true when session + favorite row exists
 *
 *   PATCH - 401 when no session
 *         - 404 when listing not found
 *         - 403 when not owner
 *         - 400 when validation fails
 *         - 200 on success
 *
 *   DELETE - 401 when no session
 *          - 404 when listing not found
 *          - 403 when not owner and not staff
 *          - 200 when owner deletes own listing
 *          - 200 when staff deletes non-owned listing
 */

// ---------------------------------------------------------------------------
// Auth mock
// ---------------------------------------------------------------------------

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
}))

// ---------------------------------------------------------------------------
// Schema + validation mocks
// ---------------------------------------------------------------------------

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  UpdateListingSchema: {},
}))

// ---------------------------------------------------------------------------
// Config mocks
// ---------------------------------------------------------------------------

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { ACTIVE: 'active', REMOVED: 'removed', DRAFT: 'draft', SOLD: 'sold' },
  normalizeSpecValue: jest.fn().mockReturnValue(null),
}))

// ---------------------------------------------------------------------------
// Helper mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
  }
})

// ---------------------------------------------------------------------------
// Logger mock
// ---------------------------------------------------------------------------

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Permissions mock
// ---------------------------------------------------------------------------

const mockIsStaffEmail = jest.fn().mockReturnValue(false)

jest.mock('@/lib/permissions', () => ({
  isStaffEmail: (...args: unknown[]) => mockIsStaffEmail(...args),
}))

// ---------------------------------------------------------------------------
// Search mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/search/meilisearch', () => ({
  indexListing: jest.fn().mockResolvedValue(undefined),
  removeListing: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/marketplace/listing-helpers', () => ({
  listingThumbnailSubquery: { __sql: 'thumbnail_subquery' },
  buildMeiliSpecs: jest.fn().mockReturnValue({}),
}))

// ---------------------------------------------------------------------------
// drizzle-orm mock
// ---------------------------------------------------------------------------

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
  asc: (a: unknown) => ({ __asc: a }),
  desc: (a: unknown) => ({ __desc: a }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  inArray: (a: unknown, b: unknown) => ({ __inArray: [a, b] }),
}))

// ---------------------------------------------------------------------------
// DB Schema mock
// ---------------------------------------------------------------------------

jest.mock('@/db/schema', () => ({
  listings: {
    id: 'l_id', sellerId: 'l_sellerId', title: 'l_title', status: 'l_status',
    priceChf: 'l_priceChf', category: 'l_category', condition: 'l_condition',
    isRevampit: 'l_isRevampit', viewCount: 'l_viewCount', favoriteCount: 'l_favoriteCount',
    createdAt: 'l_createdAt', updatedAt: 'l_updatedAt', deliveryOptions: 'l_deliveryOptions',
    paymentMode: 'l_paymentMode', pickupLocation: 'l_pickupLocation', brand: 'l_brand',
    model: 'l_model', description: 'l_description', shippingCostChf: 'l_shippingCostChf',
    conditionChecks: 'l_conditionChecks', verifiedAt: 'l_verifiedAt', verifiedBy: 'l_verifiedBy',
    verificationNotes: 'l_verificationNotes',
  },
  listingImages: {
    id: 'li_id', listingId: 'li_listingId', url: 'li_url',
    position: 'li_position', isPrimary: 'li_isPrimary',
  },
  listingSpecs: {
    id: 'ls_id', listingId: 'ls_listingId', specKey: 'ls_specKey',
    specValue: 'ls_specValue', specUnit: 'ls_specUnit', normalizedValue: 'ls_normalizedValue',
  },
  listingFavorites: {
    id: 'lf_id', userId: 'lf_userId', listingId: 'lf_listingId', createdAt: 'lf_createdAt',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
  sellerProfiles: {
    id: 'sp_id', userId: 'sp_userId', displayName: 'sp_displayName', city: 'sp_city',
    averageRating: 'sp_averageRating', bio: 'sp_bio', avatarUrl: 'sp_avatarUrl',
    canton: 'sp_canton', totalSold: 'sp_totalSold', totalReviews: 'sp_totalReviews',
  },
}))

// ---------------------------------------------------------------------------
// Drizzle chain mocks
// ---------------------------------------------------------------------------

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockDelete = jest.fn()
const mockDeleteWhere = jest.fn()
const mockTransactionFn = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
    delete: (...args: unknown[]) => { mockDelete(...args); return { where: mockDeleteWhere } },
    transaction: (...args: unknown[]) => mockTransactionFn(...args),
  },
}))

// ---------------------------------------------------------------------------
// Imports (after all mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    isStaff: false,
    staffPermissions: [] as string[],
    isSuperAdmin: false,
  },
  expires: '2027-01-01',
}

const MOCK_STAFF_SESSION = {
  user: {
    id: 'staff-1',
    email: 'admin@revamp-it.ch',
    name: 'Staff User',
    isStaff: true,
    staffPermissions: ['*'] as string[],
    isSuperAdmin: true,
  },
  expires: '2027-01-01',
}

const MOCK_LISTING = {
  id: 'listing-1',
  seller_id: 'user-1',
  title: 'Dell Laptop',
  description: 'A nice laptop',
  price_chf: '350',
  category: 'laptops',
  condition: 'good',
  brand: 'Dell',
  model: 'XPS',
  delivery_options: 'pickup',
  shipping_cost_chf: null,
  pickup_location: 'Zürich',
  payment_mode: 'cash',
  status: 'active',
  is_revampit: false,
  view_count: 10,
  favorite_count: 5,
  created_at: new Date(),
  updated_at: new Date(),
  verified_at: null,
  verified_by: null,
  verification_notes: null,
  condition_checks: null,
  seller_name: 'Test Seller',
  seller_display_name: null,
  seller_bio: null,
  seller_avatar_url: null,
  seller_city: 'Zürich',
  seller_canton: null,
  seller_rating: null,
  seller_total_sold: 0,
  seller_total_reviews: 0,
}

function makeGetRequest(id = 'listing-1') {
  return new NextRequest(`http://localhost/api/listings/${id}`)
}

function makeContext(id = 'listing-1') {
  return { params: Promise.resolve({ id }) }
}

function makePatchRequest(id = 'listing-1', body: Record<string, unknown> = { title: 'Updated' }) {
  return new NextRequest(`http://localhost/api/listings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDeleteRequest(id = 'listing-1') {
  return new NextRequest(`http://localhost/api/listings/${id}`, { method: 'DELETE' })
}

// ---------------------------------------------------------------------------
// beforeEach
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(null) // default: no session (GET is public)
  mockIsStaffEmail.mockReturnValue(false)

  // Default validation: success
  mockValidateBody.mockReturnValue({
    success: true,
    data: { title: 'Updated Title', images: [], specs: [] },
  })

  // Set up update chain
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)

  // Set up insert chain
  mockValues.mockReturnValue({ returning: jest.fn().mockResolvedValue([{ id: 'listing-1' }]) })

  // Set up delete chain
  mockDeleteWhere.mockResolvedValue(undefined)

  // Re-wire fire-and-forget search mocks after resetAllMocks()
  const { removeListing, indexListing } = require('@/lib/search/meilisearch')
  removeListing.mockResolvedValue(undefined)
  indexListing.mockResolvedValue(undefined)

  // Default transaction: success
  mockTransactionFn.mockImplementation(async (callback: (tx: unknown) => unknown) => {
    const tx = {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'listing-1' }]),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
      }),
      delete: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
    }
    return callback(tx)
  })
})

// ============================================================================
// GET /api/listings/[id]
// ============================================================================

describe('GET /api/listings/[id] — not found', () => {
  it('returns 404 when listing not found', async () => {
    // First batch: listing query (where terminal) + auth() in parallel
    // listing query: from → innerJoin → leftJoin → where → resolves to []
    const mockListingWhere = jest.fn().mockResolvedValue([])
    const mockListingLeftJoin = jest.fn().mockReturnValue({ where: mockListingWhere })
    const mockListingInnerJoin = jest.fn().mockReturnValue({ leftJoin: mockListingLeftJoin, where: mockListingWhere })
    mockFrom.mockReturnValueOnce({ innerJoin: mockListingInnerJoin, where: mockListingWhere })

    // update (fire-and-forget) uses mockUpdateWhere
    mockSet.mockReturnValue({ where: mockUpdateWhere })
    mockUpdateWhere.mockResolvedValue(undefined)

    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

describe('GET /api/listings/[id] — success (no session)', () => {
  beforeEach(() => {
    // No session → auth() returns null
    mockAuth.mockResolvedValue(null)

    // Update chain (fire-and-forget view count increment)
    mockSet.mockReturnValue({ where: mockUpdateWhere })
    mockUpdateWhere.mockResolvedValue(undefined)
  })

  it('returns 200 with full listing data and is_favorited: false', async () => {
    // 1st select: listing query — terminal: where
    const mockListingWhere = jest.fn().mockResolvedValue([MOCK_LISTING])
    const mockListingLeftJoin = jest.fn().mockReturnValue({ where: mockListingWhere })
    const mockListingInnerJoin = jest.fn().mockReturnValue({
      leftJoin: mockListingLeftJoin,
      where: mockListingWhere,
    })
    // 2nd select: images — terminal: orderBy
    const mockImagesOrderBy = jest.fn().mockResolvedValue([])
    const mockImagesWhere = jest.fn().mockReturnValue({ orderBy: mockImagesOrderBy })
    // 3rd select: specs — terminal: orderBy
    const mockSpecsOrderBy = jest.fn().mockResolvedValue([])
    const mockSpecsWhere = jest.fn().mockReturnValue({ orderBy: mockSpecsOrderBy })
    // No 4th select for favorites (no session → Promise.resolve([]))

    mockFrom
      .mockReturnValueOnce({ innerJoin: mockListingInnerJoin, where: mockListingWhere }) // listing
      .mockReturnValueOnce({ where: mockImagesWhere })  // images
      .mockReturnValueOnce({ where: mockSpecsWhere })   // specs

    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('listing-1')
    expect(body.data.images).toEqual([])
    expect(body.data.specs).toEqual([])
    expect(body.data.is_favorited).toBe(false)
  })
})

describe('GET /api/listings/[id] — success (with session)', () => {
  it('returns is_favorited: true when session and favorite row exists', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)

    // Update chain (fire-and-forget)
    mockSet.mockReturnValue({ where: mockUpdateWhere })
    mockUpdateWhere.mockResolvedValue(undefined)

    // 1st select: listing
    const mockListingWhere = jest.fn().mockResolvedValue([MOCK_LISTING])
    const mockListingLeftJoin = jest.fn().mockReturnValue({ where: mockListingWhere })
    const mockListingInnerJoin = jest.fn().mockReturnValue({
      leftJoin: mockListingLeftJoin,
      where: mockListingWhere,
    })
    // 2nd select: images
    const mockImagesOrderBy = jest.fn().mockResolvedValue([])
    const mockImagesWhere = jest.fn().mockReturnValue({ orderBy: mockImagesOrderBy })
    // 3rd select: specs
    const mockSpecsOrderBy = jest.fn().mockResolvedValue([])
    const mockSpecsWhere = jest.fn().mockReturnValue({ orderBy: mockSpecsOrderBy })
    // 4th select: favorites — terminal: where → returns a row (favorited)
    const mockFavWhere = jest.fn().mockResolvedValue([{ id: 'fav-1' }])
    const mockFavFrom = jest.fn().mockReturnValue({ where: mockFavWhere })

    mockFrom
      .mockReturnValueOnce({ innerJoin: mockListingInnerJoin, where: mockListingWhere })
      .mockReturnValueOnce({ where: mockImagesWhere })
      .mockReturnValueOnce({ where: mockSpecsWhere })
      .mockReturnValueOnce({ where: mockFavWhere })

    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.is_favorited).toBe(true)
  })

  it('returns is_favorited: false when session but no favorite row', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)

    mockSet.mockReturnValue({ where: mockUpdateWhere })
    mockUpdateWhere.mockResolvedValue(undefined)

    const mockListingWhere = jest.fn().mockResolvedValue([MOCK_LISTING])
    const mockListingLeftJoin = jest.fn().mockReturnValue({ where: mockListingWhere })
    const mockListingInnerJoin = jest.fn().mockReturnValue({
      leftJoin: mockListingLeftJoin,
      where: mockListingWhere,
    })
    const mockImagesOrderBy = jest.fn().mockResolvedValue([])
    const mockImagesWhere = jest.fn().mockReturnValue({ orderBy: mockImagesOrderBy })
    const mockSpecsOrderBy = jest.fn().mockResolvedValue([])
    const mockSpecsWhere = jest.fn().mockReturnValue({ orderBy: mockSpecsOrderBy })
    const mockFavWhere = jest.fn().mockResolvedValue([]) // not favorited

    mockFrom
      .mockReturnValueOnce({ innerJoin: mockListingInnerJoin, where: mockListingWhere })
      .mockReturnValueOnce({ where: mockImagesWhere })
      .mockReturnValueOnce({ where: mockSpecsWhere })
      .mockReturnValueOnce({ where: mockFavWhere })

    const response = await GET(makeGetRequest(), makeContext())
    const body = await response.json()
    expect(body.data.is_favorited).toBe(false)
  })
})

// ============================================================================
// PATCH /api/listings/[id]
// ============================================================================

describe('PATCH /api/listings/[id] — authentication', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makePatchRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/listings/[id] — ownership checks', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
  })

  it('returns 404 when listing not found', async () => {
    // Ownership check: select → where → resolves []
    const mockOwnerWhere = jest.fn().mockResolvedValue([])
    mockFrom.mockReturnValueOnce({ where: mockOwnerWhere })
    mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockOwnerWhere })
    mockLeftJoin.mockReturnValue({ where: mockOwnerWhere })

    const response = await PATCH(makePatchRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 403 when not owner', async () => {
    // Ownership check: sellerId is different user
    const mockOwnerWhere = jest.fn().mockResolvedValue([{ sellerId: 'other-user' }])
    mockFrom.mockReturnValueOnce({ where: mockOwnerWhere })
    mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockOwnerWhere })
    mockLeftJoin.mockReturnValue({ where: mockOwnerWhere })

    const response = await PATCH(makePatchRequest(), makeContext())
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

describe('PATCH /api/listings/[id] — validation', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    // Owner is current user
    const mockOwnerWhere = jest.fn().mockResolvedValue([{ sellerId: 'user-1' }])
    mockFrom.mockReturnValueOnce({ where: mockOwnerWhere })
  })

  it('returns 400 when validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await PATCH(makePatchRequest(), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/listings/[id] — success', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
  })

  it('returns 200 on successful update', async () => {
    // Ownership check
    const mockOwnerWhere = jest.fn().mockResolvedValue([{ sellerId: 'user-1' }])
    mockFrom.mockReturnValueOnce({ where: mockOwnerWhere })

    // Transaction
    mockTransactionFn.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      const tx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
        }),
        delete: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ id: 'listing-1' }]),
          }),
        }),
      }
      return callback(tx)
    })

    // Fire-and-forget Meilisearch select chain (status is not removed/sold/draft)
    // The route does a fire-and-forget db.select chain with .then()
    // Since it's fire-and-forget, we just need from to not crash
    const mockMeiliWhere = jest.fn().mockReturnValue({
      then: jest.fn().mockResolvedValue(undefined),
      catch: jest.fn().mockResolvedValue(undefined),
    })
    const mockMeiliLeftJoin = jest.fn().mockReturnValue({ where: mockMeiliWhere })
    const mockMeiliInnerJoin = jest.fn().mockReturnValue({ leftJoin: mockMeiliLeftJoin, where: mockMeiliWhere })
    mockFrom.mockReturnValue({ innerJoin: mockMeiliInnerJoin, leftJoin: mockMeiliLeftJoin, where: mockMeiliWhere })

    const response = await PATCH(makePatchRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.id).toBe('listing-1')
  })
})

// ============================================================================
// DELETE /api/listings/[id]
// ============================================================================

describe('DELETE /api/listings/[id] — authentication', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeDeleteRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/listings/[id] — ownership checks', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
  })

  it('returns 404 when listing not found', async () => {
    const mockOwnerWhere = jest.fn().mockResolvedValue([])
    mockFrom.mockReturnValueOnce({ where: mockOwnerWhere })

    const response = await DELETE(makeDeleteRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 403 when not owner and not staff', async () => {
    const mockOwnerWhere = jest.fn().mockResolvedValue([{ sellerId: 'other-user' }])
    mockFrom.mockReturnValueOnce({ where: mockOwnerWhere })
    mockIsStaffEmail.mockReturnValue(false)

    const response = await DELETE(makeDeleteRequest(), makeContext())
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

describe('DELETE /api/listings/[id] — success', () => {
  it('returns 200 when owner deletes own listing', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)

    // Ownership check: sellerId matches session user
    const mockOwnerWhere = jest.fn().mockResolvedValue([{ sellerId: 'user-1' }])
    mockFrom.mockReturnValueOnce({ where: mockOwnerWhere })

    // Update: set status to removed
    mockSet.mockReturnValue({ where: mockUpdateWhere })
    mockUpdateWhere.mockResolvedValue(undefined)

    const response = await DELETE(makeDeleteRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.status).toBe('removed')
    expect(body.data.id).toBe('listing-1')
  })

  it('returns 200 when staff deletes non-owned listing', async () => {
    mockAuth.mockResolvedValue(MOCK_STAFF_SESSION)

    // Ownership check: sellerId is someone else's
    const mockOwnerWhere = jest.fn().mockResolvedValue([{ sellerId: 'other-user' }])
    mockFrom.mockReturnValueOnce({ where: mockOwnerWhere })

    mockSet.mockReturnValue({ where: mockUpdateWhere })
    mockUpdateWhere.mockResolvedValue(undefined)

    const response = await DELETE(makeDeleteRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.status).toBe('removed')
  })

  it('returns 200 when isStaffEmail is true for non-staff session user', async () => {
    // User with isStaff: false but staff email
    mockAuth.mockResolvedValue({
      ...MOCK_SESSION,
      user: { ...MOCK_SESSION.user, isStaff: false },
    })
    mockIsStaffEmail.mockReturnValue(true)

    const mockOwnerWhere = jest.fn().mockResolvedValue([{ sellerId: 'other-user' }])
    mockFrom.mockReturnValueOnce({ where: mockOwnerWhere })

    mockSet.mockReturnValue({ where: mockUpdateWhere })
    mockUpdateWhere.mockResolvedValue(undefined)

    const response = await DELETE(makeDeleteRequest(), makeContext())
    expect(response.status).toBe(200)
  })
})
