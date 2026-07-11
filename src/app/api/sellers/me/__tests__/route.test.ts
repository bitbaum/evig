/**
 * @jest-environment node
 *
 * Tests for GET /api/sellers/me and PATCH /api/sellers/me
 *
 * Mission-relevant: sellers manage their public profile here. GET must return
 * 404 (not 500) when no profile exists, and PATCH must reject unknown fields
 * and no-op calls with a 400 to prevent silent data drift.
 *
 * Behaviors locked:
 *   GET /api/sellers/me
 *   - returns 401 when not authenticated
 *   - returns 200 with profile when it exists
 *   - returns 404 when no seller profile exists
 *   - returns 500 when DB throws
 *
 *   PATCH /api/sellers/me
 *   - returns 401 when not authenticated
 *   - returns 404 when no seller profile exists
 *   - returns 400 when body has no recognized fields
 *   - returns 400 on schema validation failure (e.g. invalid URL)
 *   - returns 200 with updated profile on success
 *   - returns 500 when DB throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: (req: Request, session: unknown) => unknown) =>
    (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: unknown }).user) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return handler(req, session)
      }),
}))

// Select chain: select().from().where()  AND  select().from().leftJoin().where()
// (GET + PATCH re-read join user_profiles; the PATCH exists-check does not.)
const mockSelectWhere = jest.fn()
const mockSelectLeftJoin = jest.fn().mockReturnValue({ where: mockSelectWhere })
const mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere, leftJoin: mockSelectLeftJoin })
const mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom })

// Update chain: update().set().where()  (no returning — identity lives on
// user_profiles now, so the response is re-selected via the join above).
const mockUpdateWhere = jest.fn()
const mockSet = jest.fn().mockReturnValue({ where: mockUpdateWhere })
const mockUpdate = jest.fn().mockReturnValue({ set: mockSet })

// Insert chain: insert().values().onConflictDoUpdate()  (identity upsert)
const mockOnConflict = jest.fn()
const mockValues = jest.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflict })
const mockInsert = jest.fn().mockReturnValue({ values: mockValues })

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect.apply(null, args),
    update: (...args: unknown[]) => mockUpdate.apply(null, args),
    insert: (...args: unknown[]) => mockInsert.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  sellerProfiles: {
    id: 'sp_id', userId: 'sp_userId', displayName: 'sp_displayName', bio: 'sp_bio',
    avatarUrl: 'sp_avatarUrl', city: 'sp_city', canton: 'sp_canton',
    isVerified: 'sp_isVerified', averageRating: 'sp_averageRating',
    totalReviews: 'sp_totalReviews', totalListings: 'sp_totalListings',
    totalSold: 'sp_totalSold', createdAt: 'sp_createdAt', updatedAt: 'sp_updatedAt',
  },
  userProfiles: {
    userId: 'up_userId', displayName: 'up_displayName', bio: 'up_bio',
    avatarUrl: 'up_avatarUrl', isVerified: 'up_isVerified',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'sql' }), { raw: jest.fn() }),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (entity: string) =>
      NextResponse.json({ success: false, error: `${entity} nicht gefunden` }, { status: 404 }),
    apiBadRequest: (msg: string, details?: unknown) =>
      NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
  }
})

jest.mock('@/lib/services/seller-service', () => ({
  sellerProfileCoreFields: {
    id: 'sp_id', user_id: 'sp_userId', display_name: 'sp_displayName',
    bio: 'sp_bio', avatar_url: 'sp_avatarUrl', city: 'sp_city', canton: 'sp_canton',
    is_verified: 'sp_isVerified', average_rating: 'sp_averageRating',
    total_reviews: 'sp_totalReviews', total_listings: 'sp_totalListings',
    total_sold: 'sp_totalSold', created_at: 'sp_createdAt',
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, PATCH } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'user-seller', email: 'seller@example.com', name: 'Seller', isStaff: false, staffPermissions: [] as string[], isSuperAdmin: false },
  expires: '2027-01-01',
}

const MOCK_PROFILE = {
  id: 'sp-1', user_id: 'user-seller', display_name: 'Max Verkäufer',
  bio: 'Ich verkaufe refurbished Hardware.', avatar_url: null,
  city: 'Zürich', canton: 'ZH', is_verified: false, average_rating: null,
  total_reviews: 0, total_listings: 3, total_sold: 1,
  created_at: '2026-01-01', updated_at: '2026-01-15',
}

function makeGetRequest() {
  return new NextRequest('http://localhost/api/sellers/me')
}

function makePatchRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/sellers/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Default: select (both plain and joined) returns profile
  mockSelect.mockReturnValue({ from: mockSelectFrom })
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere, leftJoin: mockSelectLeftJoin })
  mockSelectLeftJoin.mockReturnValue({ where: mockSelectWhere })
  mockSelectWhere.mockResolvedValue([MOCK_PROFILE])

  // Default: update + insert resolve
  mockUpdate.mockReturnValue({ set: mockSet })
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)
  mockInsert.mockReturnValue({ values: mockValues })
  mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflict })
  mockOnConflict.mockResolvedValue(undefined)
})

// ============================================================================
// GET /api/sellers/me
// ============================================================================

describe('GET /api/sellers/me — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/sellers/me — authenticated', () => {
  it('returns 200 when profile exists', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
  })

  it('returns the seller profile', async () => {
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.display_name).toBe('Max Verkäufer')
  })

  it('returns 404 when no profile exists', async () => {
    mockSelectWhere.mockResolvedValueOnce([])
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(404)
  })

  it('returns 500 when DB throws', async () => {
    mockSelectWhere.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(500)
  })
})

// ============================================================================
// PATCH /api/sellers/me
// ============================================================================

describe('PATCH /api/sellers/me — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makePatchRequest({ display_name: 'Neu' }))
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/sellers/me — profile not found', () => {
  it('returns 404 when profile does not exist', async () => {
    mockSelectWhere.mockResolvedValueOnce([])
    const response = await PATCH(makePatchRequest({ display_name: 'Neu' }))
    expect(response.status).toBe(404)
  })
})

describe('PATCH /api/sellers/me — validation', () => {
  it('returns 400 when body has no recognized update fields', async () => {
    const response = await PATCH(makePatchRequest({}))
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('Keine Änderungen')
  })

  it('returns 400 when avatar_url is not a valid URL', async () => {
    const response = await PATCH(makePatchRequest({ avatar_url: 'not-a-url' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when canton exceeds 2 characters', async () => {
    const response = await PATCH(makePatchRequest({ canton: 'ZHH' }))
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/sellers/me — success', () => {
  it('returns 200 with updated profile', async () => {
    const response = await PATCH(makePatchRequest({ display_name: 'Neuer Name', city: 'Bern' }))
    expect(response.status).toBe(200)
  })

  it('returns the updated profile data', async () => {
    const updated = { ...MOCK_PROFILE, display_name: 'Neuer Name' }
    // Response is re-selected via the joined query after the writes.
    mockSelectWhere.mockResolvedValue([updated])
    const response = await PATCH(makePatchRequest({ display_name: 'Neuer Name' }))
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.display_name).toBe('Neuer Name')
  })

  it('upserts identity fields into user_profiles', async () => {
    await PATCH(makePatchRequest({ display_name: 'Neuer Name' }))
    expect(mockInsert).toHaveBeenCalled()
    expect(mockOnConflict).toHaveBeenCalled()
  })

  it('calls db.update when valid fields are provided', async () => {
    await PATCH(makePatchRequest({ bio: 'Neues Bio' }))
    expect(mockUpdate).toHaveBeenCalled()
  })
})

describe('PATCH /api/sellers/me — DB error', () => {
  it('returns 500 when the write throws', async () => {
    mockOnConflict.mockRejectedValueOnce(new Error('DB error'))
    const response = await PATCH(makePatchRequest({ display_name: 'Test' }))
    expect(response.status).toBe(500)
  })
})
