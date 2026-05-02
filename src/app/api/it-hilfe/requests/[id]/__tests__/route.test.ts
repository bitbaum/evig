/**
 * @jest-environment node
 *
 * Tests for GET + PUT /api/it-hilfe/requests/[id]
 */

// ── Auth mocks ─────────────────────────────────────────────────────────────

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

// ── DB mocks ───────────────────────────────────────────────────────────────

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  itHilfeRequests: { id: 'ihr_id', requesterId: 'ihr_requesterId', status: 'ihr_status', title: 'ihr_title', matchedOfferId: 'ihr_matchedOfferId', offerCount: 'ihr_offerCount', reviewedAt: 'ihr_reviewedAt', categoryId: 'ihr_categoryId', skillsNeeded: 'ihr_skillsNeeded', canton: 'ihr_canton', budgetAmountCents: 'ihr_budgetAmountCents', budgetType: 'ihr_budgetType', serviceType: 'ihr_serviceType', completedAt: 'ihr_completedAt', expiresAt: 'ihr_expiresAt', createdAt: 'ihr_createdAt', updatedAt: 'ihr_updatedAt', deviceBrand: 'ihr_deviceBrand', deviceModel: 'ihr_deviceModel', description: 'ihr_description', urgency: 'ihr_urgency', postalCode: 'ihr_postalCode', city: 'ihr_city', imageUrls: 'ihr_imageUrls', aiDiagnosis: 'ihr_aiDiagnosis', completedBy: 'ihr_completedBy' },
  itHilfeOffers: { id: 'iho_id', requestId: 'iho_requestId', helperId: 'iho_helperId', status: 'iho_status' },
  helperProfiles: { id: 'hp_id', userId: 'hp_userId', totalHelpsCompleted: 'hp_totalHelpsCompleted' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm/pg-core', () => ({
  alias: (_table: unknown, name: string) => ({
    id: `${name}_id`,
    helperId: `${name}_helperId`,
    status: `${name}_status`,
  }),
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}))

// ── Other mocks ────────────────────────────────────────────────────────────

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  UpdateITHilfeRequestSchema: {},
}))

jest.mock('@/lib/it-hilfe/request-mapper', () => ({
  mapRequestDetailRow: jest.fn((row: Record<string, unknown>, isOwner: boolean) => ({ ...row, isOwner })),
}))

jest.mock('@/lib/it-hilfe/notifications', () => ({
  sendItHilfeNotification: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiForbidden: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiUnauthorized: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 401 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { UNAUTHORIZED: 'Unauthorized', INTERNAL_SERVER_ERROR: 'Server error' },
}))

jest.mock('@/config/it-hilfe', () => ({
  REQUEST_STATUS: { OPEN: 'open', IN_DISCUSSION: 'in_discussion', MATCHED: 'matched', COMPLETED: 'completed' },
  VALID_REQUEST_TRANSITIONS: { open: ['in_discussion', 'cancelled'], in_discussion: ['open', 'cancelled'] },
  deriveBudgetType: jest.fn().mockReturnValue('free'),
}))

// ── Fixtures ───────────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}
const MOCK_REQUEST_ROW = {
  id: VALID_UUID,
  requester_id: 'user-1',
  requester_name: 'Test User',
  requester_email: 'user@example.com',
  category_id: 'cat-1',
  title: 'IT Hilfe',
  status: 'open',
  matchedOfferId: null,
  offerCount: 0,
}

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { GET, PUT } from '../route'

// ── Helpers ────────────────────────────────────────────────────────────────

function makeGetRequest(id: string) {
  return new NextRequest(`http://localhost/api/it-hilfe/requests/${id}`)
}

function makePutRequest(id: string, body: unknown) {
  return new NextRequest(`http://localhost/api/it-hilfe/requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const routeParams = (id: string) => ({ params: Promise.resolve({ id }) })

function setupSingleSelectChain(row: unknown | null) {
  const rows = row ? [row] : []
  mockWhere.mockResolvedValue(rows)
  mockLeftJoin.mockReturnValue({ where: mockWhere })
  mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
  mockSelect.mockReturnValue({ from: mockFrom })
}

// ── GET Tests ──────────────────────────────────────────────────────────────

describe('GET /api/it-hilfe/requests/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 for invalid UUID', async () => {
    const res = await GET(makeGetRequest('bad-id'), routeParams('bad-id'))
    expect(res.status).toBe(400)
  })

  it('returns 404 when request not found', async () => {
    mockAuth.mockResolvedValue(null)
    setupSingleSelectChain(null)

    const res = await GET(makeGetRequest(VALID_UUID), routeParams(VALID_UUID))
    expect(res.status).toBe(404)
  })

  it('returns 200 with request data', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupSingleSelectChain(MOCK_REQUEST_ROW)

    const res = await GET(makeGetRequest(VALID_UUID), routeParams(VALID_UUID))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.request).toBeDefined()
  })
})

// ── PUT Tests ──────────────────────────────────────────────────────────────

describe('PUT /api/it-hilfe/requests/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateWhere.mockResolvedValue(undefined)
    mockSet.mockReturnValue({ where: mockUpdateWhere })
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await PUT(makePutRequest(VALID_UUID, { title: 'New' }), routeParams(VALID_UUID))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid UUID', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)

    const res = await PUT(makePutRequest('bad-id', { title: 'New' }), routeParams('bad-id'))
    expect(res.status).toBe(400)
  })

  it('returns 404 when request not found', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    mockWhere.mockResolvedValue([])
    mockFrom.mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const res = await PUT(makePutRequest(VALID_UUID, { title: 'New' }), routeParams(VALID_UUID))
    expect(res.status).toBe(404)
  })

  it('returns 403 when user is not owner', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    mockWhere.mockResolvedValue([{ requesterId: 'other-user', status: 'open', title: 'X', matchedOfferId: null }])
    mockFrom.mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const res = await PUT(makePutRequest(VALID_UUID, { title: 'New' }), routeParams(VALID_UUID))
    expect(res.status).toBe(403)
  })

  it('returns 400 when validation fails', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    mockWhere.mockResolvedValue([{ requesterId: 'user-1', status: 'open', title: 'X', matchedOfferId: null }])
    mockFrom.mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValue({
      success: false,
      error: NextResponse.json({ success: false, error: 'Invalid' }, { status: 400 }),
    })

    const res = await PUT(makePutRequest(VALID_UUID, {}), routeParams(VALID_UUID))
    expect(res.status).toBe(400)
  })

  it('returns 200 when update succeeds', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    mockWhere.mockResolvedValue([{ requesterId: 'user-1', status: 'open', title: 'Old Title', matchedOfferId: null }])
    mockFrom.mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    mockValidateBody.mockReturnValue({
      success: true,
      data: { title: 'New Title' },
    })

    const res = await PUT(makePutRequest(VALID_UUID, { title: 'New Title' }), routeParams(VALID_UUID))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })
})
