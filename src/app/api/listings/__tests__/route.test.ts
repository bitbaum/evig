/**
 * @jest-environment node
 *
 * Tests for GET /api/listings and POST /api/listings
 *
 * Behaviors locked:
 *   GET /api/listings
 *   - 400 when rate limiter returns false
 *   - 200 with empty items when no rows returned
 *   - 200 with items and specs when rows returned
 *
 *   POST /api/listings
 *   - 401 when not authenticated
 *   - 400 when rate limited
 *   - 400 when body validation fails
 *   - 201 on success with transaction called
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
const mockValidateQuery = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  validateQuery: (...args: unknown[]) => mockValidateQuery.apply(null, args),
  CreateListingSchema: {},
  UpdateListingSchema: {},
  ListingsQuerySchema: {},
}))

// ---------------------------------------------------------------------------
// Config mocks
// ---------------------------------------------------------------------------

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { ACTIVE: 'active', REMOVED: 'removed', DRAFT: 'draft', SOLD: 'sold' },
  MARKETPLACE_SELLER_TYPE: { REVAMPIT: 'revampit', COMMUNITY: 'community' },
  SPEC_QUERY_PARAM_KEYS: {
    spec_ram_min:     ['RAM'],
    spec_storage_min: ['Speicher'],
    spec_display_min: ['Display', 'Grösse'],
  },
  normalizeSpecValue: jest.fn().mockReturnValue(null),
}))

jest.mock('@/config/marketplace-status', () => ({
  MARKETPLACE_STATUS: { DRAFT: 'draft' },
}))

jest.mock('@/config/urls', () => ({ APP_URL: 'https://example.com' }))

// ---------------------------------------------------------------------------
// Rate limiter + sanitize mocks
// ---------------------------------------------------------------------------

// NOTE: jest.mock factories are hoisted before variable declarations.
// To avoid the "Cannot access before initialization" error, we use
// jest.fn() directly in the factory and expose them via module-level
// handles that are wired in beforeEach via require().
jest.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: {
    listingBrowse: jest.fn().mockReturnValue(true),
    listingCreate: jest.fn().mockReturnValue(true),
  },
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
}))

jest.mock('@/lib/security/sanitize', () => ({
  sanitizeInput: (v: string) => v,
}))

// ---------------------------------------------------------------------------
// Helper mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiSuccessCached: (data: unknown) =>
      NextResponse.json({ success: true, data }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiRateLimited: (msg = 'Zu viele Anfragen. Bitte versuche es später erneut.') =>
      NextResponse.json({ success: false, error: msg }, { status: 429 }),
    parsePagination: () => ({ limit: 20, offset: 0, page: 1 }),
  }
})

// ---------------------------------------------------------------------------
// Logger mock
// ---------------------------------------------------------------------------

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Marketplace helpers + search mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/marketplace/listing-helpers', () => ({
  listingThumbnailSubquery: { __sql: 'thumbnail_subquery' },
  indexListingInSearch: jest.fn(),
  buildMeiliSpecs: jest.fn().mockReturnValue({}),
}))

jest.mock('@/lib/search/meilisearch', () => ({
  indexListing: jest.fn().mockResolvedValue(undefined),
  removeListing: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/permissions', () => ({
  isStaffEmail: jest.fn().mockReturnValue(false),
}))

jest.mock('@/lib/email', () => ({
  sendCustomEmail: jest.fn().mockResolvedValue({ success: true }),
}))

jest.mock('@/lib/email/templates/marketplace', () => ({
  listingPublishedConfirmation: jest.fn().mockReturnValue({}),
}))

// ---------------------------------------------------------------------------
// drizzle-orm mock
// ---------------------------------------------------------------------------

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  asc: (a: unknown) => ({ __asc: a }),
  desc: (a: unknown) => ({ __desc: a }),
  inArray: (a: unknown, b: unknown) => ({ __inArray: [a, b] }),
  gte: (a: unknown, b: unknown) => ({ __gte: [a, b] }),
  lte: (a: unknown, b: unknown) => ({ __lte: [a, b] }),
}))

// ---------------------------------------------------------------------------
// Schema mock
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
  userProfiles: { userId: 'up_userId', displayName: 'up_displayName', bio: 'up_bio', avatarUrl: 'up_avatarUrl', isVerified: 'up_isVerified' },
  sellerProfiles: {
    id: 'sp_id', userId: 'sp_userId', displayName: 'sp_displayName', city: 'sp_city',
    averageRating: 'sp_averageRating', bio: 'sp_bio', avatarUrl: 'sp_avatarUrl',
    canton: 'sp_canton', totalSold: 'sp_totalSold', totalReviews: 'sp_totalReviews',
  },
}))

// ---------------------------------------------------------------------------
// Drizzle chain mocks (declared here, wired in beforeEach)
// ---------------------------------------------------------------------------

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockOffset = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()
const mockTransactionFn = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
    transaction: (...args: unknown[]) => mockTransactionFn(...args),
  },
}))

// ---------------------------------------------------------------------------
// Imports (after all mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

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

const MOCK_LISTING_ROW = {
  id: 'listing-1',
  title: 'Dell Laptop',
  price_chf: '350',
  category: 'laptops',
  condition: 'good',
  brand: 'Dell',
  model: 'XPS',
  delivery_options: 'pickup',
  payment_mode: 'cash',
  status: 'active',
  is_revampit: false,
  pickup_location: 'Zürich',
  view_count: 10,
  favorite_count: 5,
  created_at: new Date(),
  verified_at: null,
  seller_name: 'Test Seller',
  seller_display_name: null,
  seller_rating: null,
  seller_city: 'Zürich',
  thumbnail: null,
  _total: 1,
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/listings')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

function makePostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// beforeEach — wire the Drizzle chain
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Wire rate limiters via require() — avoids hoisting issues with const declarations
  const rl = require('@/lib/security/rate-limit')
  rl.rateLimiters.listingBrowse.mockReturnValue(true)
  rl.rateLimiters.listingCreate.mockReturnValue(true)

  // Default validation: success
  mockValidateQuery.mockReturnValue({
    success: true,
    data: { limit: 20, offset: 0, sort: 'newest' },
  })
  mockValidateBody.mockReturnValue({
    success: true,
    data: {
      title: 'Test Laptop',
      description: 'A nice laptop',
      price_chf: 300,
      category: 'laptops',
      condition: 'good',
      delivery_options: 'pickup',
      payment_mode: 'cash',
      status: 'active',
      images: ['https://example.com/img.jpg'],
      specs: [],
    },
  })

  // Default Drizzle chain for first select (main listings query)
  // terminal: .offset()
  mockFrom.mockReturnValue({
    innerJoin: mockInnerJoin,
    leftJoin: mockLeftJoin,
    where: mockWhere,
    orderBy: mockOrderBy,
  })
  mockInnerJoin.mockReturnValue({
    innerJoin: mockInnerJoin,
    leftJoin: mockLeftJoin,
    where: mockWhere,
  })
  mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy, limit: mockLimit })
  mockOrderBy.mockReturnValue({ limit: mockLimit, where: mockWhere })
  mockLimit.mockReturnValue({ offset: mockOffset })
  // Default: no rows
  mockOffset.mockResolvedValue([])

  // Insert chain defaults
  mockValues.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([{ id: 'new-listing-id' }])

  // Re-wire fire-and-forget mocks after resetAllMocks() so .catch() calls don't throw
  const { indexListingInSearch } = require('@/lib/marketplace/listing-helpers')
  const { sendCustomEmail } = require('@/lib/email')
  indexListingInSearch.mockReturnValue(undefined)
  sendCustomEmail.mockResolvedValue({ success: true })

  // Transaction default: success
  mockTransactionFn.mockImplementation(async (callback: (tx: unknown) => unknown) => {
    const tx = {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'new-listing-id' }]),
        }),
      }),
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // no existing seller profile
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
// GET /api/listings
// ============================================================================

describe('GET /api/listings — rate limiting', () => {
  it('returns 429 when rate limiter returns false', async () => {
    const rl = require('@/lib/security/rate-limit')
    rl.rateLimiters.listingBrowse.mockReturnValueOnce(false)
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(429)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/viele Anfragen/i)
  })
})

describe('GET /api/listings — empty results', () => {
  it('returns 200 with empty items when no rows returned', async () => {
    // mockOffset already resolves to [] by default
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.items).toEqual([])
    expect(body.data.pagination).toMatchObject({ total: 0, limit: 20, offset: 0 })
  })

  it('does not call second select when items is empty', async () => {
    await GET(makeGetRequest())
    // Only one select call (main query) — no specs query
    expect(mockSelect).toHaveBeenCalledTimes(1)
  })
})

describe('GET /api/listings — with items', () => {
  beforeEach(() => {
    // First select (main query): returns rows with _total
    mockOffset.mockResolvedValueOnce([MOCK_LISTING_ROW])
    // Second select (specs query): terminal is orderBy
    const mockSpecsOrderBy = jest.fn().mockResolvedValue([
      { listing_id: 'listing-1', key: 'RAM', value: '16GB', unit: null },
    ])
    const mockSpecsWhere = jest.fn().mockReturnValue({ orderBy: mockSpecsOrderBy })
    const mockSpecsFrom = jest.fn().mockReturnValue({ where: mockSpecsWhere })
    // Second call to mockFrom returns the specs chain
    mockFrom.mockReturnValueOnce({
      innerJoin: mockInnerJoin,
      leftJoin: mockLeftJoin,
      where: mockWhere,
    })
    mockFrom.mockReturnValueOnce({ where: mockSpecsWhere })
    // Re-wire first call offset to return the listing row
    mockOffset.mockResolvedValue([MOCK_LISTING_ROW])
    // Restore specs from chain override for second select
    mockFrom
      .mockReturnValueOnce({
        innerJoin: mockInnerJoin,
        leftJoin: mockLeftJoin,
        where: mockWhere,
      })
      .mockReturnValueOnce({ where: mockSpecsWhere })
  })

  it('returns 200 with items when rows returned', async () => {
    // Simple setup: offset returns one row, second select orderBy returns specs
    const mockSpecsOrderBy2 = jest.fn().mockResolvedValue([])
    const mockSpecsWhere2 = jest.fn().mockReturnValue({ orderBy: mockSpecsOrderBy2 })

    mockFrom
      .mockReturnValueOnce({
        innerJoin: mockInnerJoin,
        leftJoin: mockLeftJoin,
        where: mockWhere,
      })
      .mockReturnValueOnce({ where: mockSpecsWhere2 })

    mockOffset.mockResolvedValueOnce([MOCK_LISTING_ROW])

    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.items).toHaveLength(1)
    expect(body.data.items[0].id).toBe('listing-1')
    expect(body.data.pagination.total).toBe(1)
  })

  it('attaches specs to items', async () => {
    const specRow = { listing_id: 'listing-1', key: 'RAM', value: '16GB', unit: null }
    const mockSpecsOrderBy3 = jest.fn().mockResolvedValue([specRow])
    const mockSpecsWhere3 = jest.fn().mockReturnValue({ orderBy: mockSpecsOrderBy3 })

    mockFrom
      .mockReturnValueOnce({
        innerJoin: mockInnerJoin,
        leftJoin: mockLeftJoin,
        where: mockWhere,
      })
      .mockReturnValueOnce({ where: mockSpecsWhere3 })

    mockOffset.mockResolvedValueOnce([MOCK_LISTING_ROW])

    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.data.items[0].specs).toContainEqual({
      key: 'RAM',
      value: '16GB',
      unit: null,
    })
  })
})

// ============================================================================
// POST /api/listings
// ============================================================================

describe('POST /api/listings — authentication', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest())
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

describe('POST /api/listings — rate limiting', () => {
  it('returns 400 when rate limited', async () => {
    const rl = require('@/lib/security/rate-limit')
    rl.rateLimiters.listingCreate.mockReturnValueOnce(false)
    const response = await POST(makePostRequest())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/viele Inserate/i)
  })
})

describe('POST /api/listings — validation', () => {
  it('returns 400 when body validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Eingabedaten' },
        { status: 400 }
      ),
    })
    const response = await POST(makePostRequest({}))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/listings — success', () => {
  it('returns 201 with listing id on success', async () => {
    const response = await POST(makePostRequest({
      title: 'Test Laptop',
      description: 'A nice laptop',
      price_chf: 300,
      category: 'laptops',
      condition: 'good',
      delivery_options: 'pickup',
      payment_mode: 'cash',
      status: 'active',
      images: ['https://example.com/img.jpg'],
    }))
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('new-listing-id')
  })

  it('calls db.transaction to create listing', async () => {
    await POST(makePostRequest({
      title: 'Test Laptop',
      description: 'A nice laptop',
      price_chf: 300,
      category: 'laptops',
      condition: 'good',
      delivery_options: 'pickup',
      payment_mode: 'cash',
      status: 'active',
      images: [],
    }))
    expect(mockTransactionFn).toHaveBeenCalledTimes(1)
  })
})
