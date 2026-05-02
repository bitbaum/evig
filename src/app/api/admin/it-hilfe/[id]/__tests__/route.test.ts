/**
 * @jest-environment node
 *
 * Tests for GET/PATCH/DELETE /api/admin/it-hilfe/[id]
 *
 * Behaviors locked:
 *   GET /api/admin/it-hilfe/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when request not found
 *   - returns 200 with request and offers
 *
 *   PATCH /api/admin/it-hilfe/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 400 when no changes provided
 *   - returns 200 on success
 *
 *   DELETE /api/admin/it-hilfe/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when not found or already in terminal state
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
const mockUpdateReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  itHilfeRequests: { id: 'r_id', requesterId: 'r_requesterId', categoryId: 'r_catId', deviceBrand: 'r_brand', deviceModel: 'r_model', title: 'r_title', description: 'r_desc', urgency: 'r_urgency', budgetType: 'r_budgetType', budgetAmountCents: 'r_budget', postalCode: 'r_postalCode', city: 'r_city', canton: 'r_canton', serviceType: 'r_serviceType', skillsNeeded: 'r_skills', imageUrls: 'r_images', status: 'r_status', matchedOfferId: 'r_matchedOffer', offerCount: 'r_offerCount', serviceCategory: 'r_serviceCategory', aiDiagnosis: 'r_aiDiagnosis', adminNotes: 'r_adminNotes', expiresAt: 'r_expiresAt', createdAt: 'r_createdAt', updatedAt: 'r_updatedAt' },
  itHilfeOffers: { id: 'o_id', message: 'o_message', status: 'o_status', estimatedTime: 'o_estimatedTime', proposedCompensation: 'o_proposedComp', createdAt: 'o_createdAt', helperId: 'o_helperId', requestId: 'o_requestId' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  notInArray: (col: unknown, arr: unknown) => ({ __notInArray: [col, arr] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler', IT_HILFE_REQUEST_NOT_FOUND: 'Nicht gefunden' },
}))

jest.mock('@/config/it-hilfe', () => ({
  REQUEST_STATUS: { OPEN: 'open', CLOSED: 'closed', COMPLETED: 'completed', CANCELLED: 'cancelled' },
  VALID_REQUEST_TRANSITIONS: { open: ['closed', 'completed'] },
}))

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
}))

jest.mock('@/lib/schemas/it-hilfe', () => ({
  AdminEditRequestSchema: {},
}))

jest.mock('@/lib/activity', () => ({
  logActivity: jest.fn(),
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

const MOCK_REQUEST = { id: 'req-1', title: 'Laptop kaputt', status: 'open', requester_name: 'Hans', requester_email: 'hans@example.com' }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/it-hilfe/req-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(id = 'req-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // SELECT chain: from().innerJoin().where() — terminal is where
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
  mockInnerJoin.mockReturnValue({ where: mockWhere })
  // GET uses where twice: once for request, once for offers
  mockWhere
    .mockResolvedValueOnce([MOCK_REQUEST])  // first call: request detail
    .mockResolvedValueOnce([])              // second call: offers

  // UPDATE chain: update().set().where().returning()
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning })
  mockUpdateReturning.mockResolvedValue([{ ...MOCK_REQUEST, updatedAt: '2026-01-01' }])

  mockValidateBody.mockReturnValue({ success: true, data: { title: 'Updated title' } })
})

// ============================================================================
// GET /api/admin/it-hilfe/[id]
// ============================================================================

describe('GET /api/admin/it-hilfe/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/it-hilfe/[id] — authenticated', () => {
  it('returns 404 when request not found', async () => {
    mockWhere.mockReset()
    mockWhere.mockResolvedValueOnce([])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 with request and offers', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.id).toBe('req-1')
    expect(body.data.offers).toEqual([])
  })
})

// ============================================================================
// PATCH /api/admin/it-hilfe/[id]
// ============================================================================

describe('PATCH /api/admin/it-hilfe/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest('PATCH', { title: 'New' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/admin/it-hilfe/[id] — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await PATCH(makeRequest('PATCH', {}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when no changes are provided', async () => {
    mockValidateBody.mockReturnValueOnce({ success: true, data: {} })
    const response = await PATCH(makeRequest('PATCH', {}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/admin/it-hilfe/[id] — success', () => {
  it('returns 200 on success', async () => {
    const response = await PATCH(makeRequest('PATCH', { title: 'Updated title' }), makeContext())
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// DELETE /api/admin/it-hilfe/[id]
// ============================================================================

describe('DELETE /api/admin/it-hilfe/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/admin/it-hilfe/[id] — authenticated', () => {
  it('returns 404 when not found or already in terminal state', async () => {
    mockUpdateReturning.mockResolvedValueOnce([])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 on success', async () => {
    mockUpdateReturning.mockResolvedValueOnce([{ id: 'req-1' }])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.cancelled).toBe(true)
  })
})
