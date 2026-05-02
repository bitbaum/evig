/**
 * @jest-environment node
 *
 * Tests for GET/PATCH/DELETE /api/admin/marketplace/[id]
 *
 * Behaviors locked:
 *   GET /api/admin/marketplace/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when listing not found
 *   - returns 200 with listing details
 *
 *   PATCH /api/admin/marketplace/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 400 when no changes provided
 *   - returns 404 when listing not found
 *   - returns 200 on success
 *
 *   DELETE /api/admin/marketplace/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when listing not found
 *   - returns 200 on success
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler
    return (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params
          ? { params: await context.params }
          : undefined
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, resolvedContext)
      })
  },
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockReturning = jest.fn()
const mockValidateBody = jest.fn()
const mockRemoveListing = jest.fn()
const mockLogAdminAction = jest.fn()
const mockGetClientIdentifier = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  listings: {
    id: 'l_id', title: 'l_title', description: 'l_desc', priceChf: 'l_price',
    category: 'l_category', condition: 'l_condition', status: 'l_status',
    adminNotes: 'l_adminNotes', isRevampit: 'l_isRevampit', verifiedAt: 'l_verifiedAt',
    createdAt: 'l_createdAt', sellerId: 'l_sellerId', updatedAt: 'l_updatedAt',
  },
  listingImages: { id: 'li_id', url: 'li_url', position: 'li_position', listingId: 'li_listingId' },
  listingSpecs: { id: 'ls_id', specKey: 'ls_key', specValue: 'ls_value', specUnit: 'ls_unit', listingId: 'ls_listingId' },
  listingReports: {
    id: 'lr_id', reason: 'lr_reason', details: 'lr_details', status: 'lr_status',
    createdAt: 'lr_createdAt', reporterId: 'lr_reporterId', listingId: 'lr_listingId',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Interner Serverfehler',
    LISTING_NOT_FOUND: 'Inserat nicht gefunden',
  },
}))

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { REMOVED: 'removed' },
}))

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
}))

jest.mock('@/lib/schemas/marketplace', () => ({
  AdminEditListingSchema: {},
}))

jest.mock('@/lib/search/meilisearch', () => ({
  removeListing: (...args: unknown[]) => mockRemoveListing.apply(null, args),
}))

jest.mock('@/lib/auth/audit', () => ({
  logAdminAction: (...args: unknown[]) => mockLogAdminAction.apply(null, args),
}))

jest.mock('@/lib/security/rate-limit', () => ({
  getClientIdentifier: (...args: unknown[]) => mockGetClientIdentifier.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_LISTING = { id: 'lst-1', title: 'Laptop', status: 'active', sellerId: 'user-1' }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/marketplace/lst-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(id = 'lst-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // mockFrom returns object with both where and innerJoin to support all query shapes
  mockFrom.mockReturnValue({ where: mockWhere, innerJoin: mockInnerJoin })
  mockInnerJoin.mockReturnValue({ where: mockWhere })

  // GET: listing → seller → images → specs → reports (5 sequential where calls)
  mockWhere
    .mockResolvedValueOnce([MOCK_LISTING])                                   // listing
    .mockResolvedValueOnce([{ name: 'Hans', email: 'hans@example.com' }])   // seller
    .mockResolvedValueOnce([])                                               // images
    .mockResolvedValueOnce([])                                               // specs
    .mockResolvedValueOnce([])                                               // reports

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([{ ...MOCK_LISTING, updatedAt: '2026-01-01' }])

  mockRemoveListing.mockResolvedValue(undefined)
  mockLogAdminAction.mockReturnValue(undefined)
  mockGetClientIdentifier.mockReturnValue('127.0.0.1')

  mockValidateBody.mockReturnValue({ success: true, data: { title: 'Updated title' } })
})

// ============================================================================
// GET /api/admin/marketplace/[id]
// ============================================================================

describe('GET /api/admin/marketplace/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/marketplace/[id] — authenticated', () => {
  it('returns 404 when listing not found', async () => {
    mockWhere.mockReset()
    mockWhere.mockResolvedValueOnce([])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 with listing details', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.id).toBe('lst-1')
    expect(body.data.images).toBeNull()
    expect(body.data.reports).toBeNull()
  })
})

// ============================================================================
// PATCH /api/admin/marketplace/[id]
// ============================================================================

describe('PATCH /api/admin/marketplace/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest('PATCH', { title: 'New' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/admin/marketplace/[id] — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await PATCH(makeRequest('PATCH', {}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when no changes provided', async () => {
    mockValidateBody.mockReturnValueOnce({ success: true, data: {} })
    const response = await PATCH(makeRequest('PATCH', {}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when listing not found', async () => {
    mockReturning.mockResolvedValueOnce([])
    const response = await PATCH(makeRequest('PATCH', { title: 'New' }), makeContext())
    expect(response.status).toBe(404)
  })
})

describe('PATCH /api/admin/marketplace/[id] — success', () => {
  it('returns 200 on success', async () => {
    const response = await PATCH(makeRequest('PATCH', { title: 'New' }), makeContext())
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// DELETE /api/admin/marketplace/[id]
// ============================================================================

describe('DELETE /api/admin/marketplace/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/admin/marketplace/[id] — authenticated', () => {
  it('returns 404 when listing not found', async () => {
    mockReturning.mockResolvedValueOnce([])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 on success', async () => {
    mockReturning.mockResolvedValueOnce([{ id: 'lst-1' }])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.removed).toBe(true)
  })
})
