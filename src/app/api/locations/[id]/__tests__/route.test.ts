/**
 * @jest-environment node
 *
 * Tests for GET /api/locations/[id], PUT /api/locations/[id], DELETE /api/locations/[id]
 * Note: these routes call auth() directly (not withAuth middleware).
 *
 * Behaviors locked:
 *   GET    - 401, 404, 200
 *   PUT    - 401, 404, 403 (not owner), 403 (approved, non-admin), 400 (no fields), 200
 *   DELETE - 401, 404, 403 (not owner), 400 (active bookings), 200
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockGroupBy = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockReturning = jest.fn()
const mockDelete = jest.fn()
const mockDeleteWhere = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    delete: (...args: unknown[]) => { mockDelete(...args); return { where: mockDeleteWhere } },
  },
}))

jest.mock('@/db/schema', () => ({
  locations: {
    id: 'loc_id', name: 'loc_name', type: 'loc_type', createdBy: 'loc_createdBy',
    approvalStatus: 'loc_approvalStatus', isApproved: 'loc_isApproved',
    approvedBy: 'loc_approvedBy', approvedAt: 'loc_approvedAt',
    usageCount: 'loc_usageCount', lastUsedAt: 'loc_lastUsedAt',
    updatedAt: 'loc_updatedAt',
  },
  locationApprovals: {
    id: 'la_id', locationId: 'la_locationId', action: 'la_action',
    reviewedAt: 'la_reviewedAt', reviewNotes: 'la_reviewNotes',
  },
  locationBookings: {
    id: 'lb_id', locationId: 'lb_locationId', bookedBy: 'lb_bookedBy',
    status: 'lb_status', startTime: 'lb_startTime', endTime: 'lb_endTime',
    title: 'lb_title',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm/pg-core', () => ({
  alias: (_table: unknown, name: string) => ({
    id: `${name}_id`,
    name: `${name}_name`,
    email: `${name}_email`,
  }),
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  inArray: (a: unknown, b: unknown) => ({ __inArray: [a, b] }),
  desc: (a: unknown) => ({ __desc: a }),
  ilike: (a: unknown, b: unknown) => ({ __ilike: [a, b] }),
}))

jest.mock('@/config/location-status', () => ({
  LOCATION_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended',
  },
}))

jest.mock('@/config/booking-status', () => ({
  BOOKING_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    REQUESTED: 'requested',
    CANCELLED: 'cancelled',
  },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    UNAUTHORIZED: 'Unauthorized',
  },
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: {
    LOCATION_APPROVALS: 'location_approvals',
    LOCATION_BOOKINGS: 'location_bookings',
  },
}))

jest.mock('@/config/api-defaults', () => ({
  API_DEFAULTS: { RECENT_BOOKINGS_LIMIT: 5 },
}))

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  UpdateLocationSchema: {},
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, details?: unknown) => NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiForbidden: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiUnauthorized: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 401 }),
    parsePagination: (_req: unknown) => ({ limit: 20, offset: 0 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '../route'

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

const MOCK_LOCATION_ROW = {
  location: {
    id: 'loc-1',
    name: 'RevampIT Zürich',
    type: 'workshop',
    createdBy: 'user-1',
    approvalStatus: 'approved',
  },
  creatorName: 'Test User',
  creatorEmail: 'user@example.com',
  lastApprovalAction: 'approve',
  lastReviewedAt: new Date('2026-01-01'),
  lastReviewNotes: null,
  totalBookings: '2',
  upcomingBookings: '1',
}

const MOCK_LOCATION_STUB = {
  createdBy: 'user-1',
  approvalStatus: 'pending',
}

function makeContext(id = 'loc-1') {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(method = 'GET', body?: unknown) {
  return new NextRequest(`http://localhost/api/locations/loc-1`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockValidateBody.mockReturnValue({
    success: true,
    data: { name: 'Updated Name' },
  })

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([{ ...MOCK_LOCATION_STUB, id: 'loc-1', name: 'Updated Name' }])
  mockDeleteWhere.mockResolvedValue(undefined)

  // Default select: supports various chains (GET detail, bookings, PUT/DELETE ownership)
  mockLimit.mockResolvedValue([])
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockGroupBy.mockReturnValue({ ...{} })
  mockGroupBy.mockImplementation((..._args: unknown[]) =>
    Promise.resolve([MOCK_LOCATION_ROW])
  )
  mockWhere.mockReturnValue({ groupBy: mockGroupBy, orderBy: mockOrderBy, limit: mockLimit })
  mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere, groupBy: mockGroupBy })
  mockFrom.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockSelect.mockReturnValue({ from: mockFrom })
})

// ============================================================================
// GET /api/locations/[id] — unauthenticated
// ============================================================================

describe('GET /api/locations/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// GET /api/locations/[id] — not found
// ============================================================================

describe('GET /api/locations/[id] — not found', () => {
  it('returns 404 when location does not exist', async () => {
    mockGroupBy.mockImplementationOnce(() => Promise.resolve([]))
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(404)
  })
})

// ============================================================================
// GET /api/locations/[id] — success
// ============================================================================

describe('GET /api/locations/[id] — success', () => {
  it('returns 200 with location detail', async () => {
    // Second select for recent bookings — returns empty
    let selectCallCount = 0
    mockSelect.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) return { from: mockFrom }
      // For bookings select chain
      const mockBookingsWhere = jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
      })
      const mockBookingsFrom = jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({ where: mockBookingsWhere }),
          where: mockBookingsWhere,
        }),
        where: mockBookingsWhere,
      })
      return { from: mockBookingsFrom }
    })
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('location')
    expect(body.data).toHaveProperty('recentBookings')
  })
})

// ============================================================================
// PUT /api/locations/[id] — unauthenticated
// ============================================================================

describe('PUT /api/locations/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest('PUT', { name: 'New Name' })
    const response = await PUT(req, makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// PUT /api/locations/[id] — validation
// ============================================================================

describe('PUT /api/locations/[id] — validation', () => {
  it('returns 400 when body validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 }),
    })
    const req = makeRequest('PUT', {})
    const response = await PUT(req, makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when location not found', async () => {
    mockWhere.mockReturnValueOnce(Promise.resolve([]))
    const req = makeRequest('PUT', { name: 'New Name' })
    const response = await PUT(req, makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 403 when user does not own location', async () => {
    mockWhere.mockReturnValueOnce(Promise.resolve([{ ...MOCK_LOCATION_STUB, createdBy: 'other-user' }]))
    const req = makeRequest('PUT', { name: 'New Name' })
    const response = await PUT(req, makeContext())
    expect(response.status).toBe(403)
  })

  it('returns 403 when non-admin tries to edit approved location', async () => {
    mockWhere.mockReturnValueOnce(Promise.resolve([{ ...MOCK_LOCATION_STUB, approvalStatus: 'approved' }]))
    const req = makeRequest('PUT', { name: 'New Name' })
    const response = await PUT(req, makeContext())
    expect(response.status).toBe(403)
  })

  it('returns 400 when no valid fields to update', async () => {
    mockWhere.mockReturnValueOnce(Promise.resolve([MOCK_LOCATION_STUB]))
    mockValidateBody.mockReturnValueOnce({ success: true, data: {} })
    const req = makeRequest('PUT', {})
    const response = await PUT(req, makeContext())
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// PUT /api/locations/[id] — success
// ============================================================================

describe('PUT /api/locations/[id] — success', () => {
  it('returns 200 with updated location', async () => {
    mockWhere.mockReturnValueOnce(Promise.resolve([MOCK_LOCATION_STUB]))
    const req = makeRequest('PUT', { name: 'New Name' })
    const response = await PUT(req, makeContext())
    expect(response.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('allows admin to edit approved location', async () => {
    mockAuth.mockResolvedValueOnce(MOCK_STAFF_SESSION)
    mockWhere.mockReturnValueOnce(Promise.resolve([{ ...MOCK_LOCATION_STUB, approvalStatus: 'approved' }]))
    const req = makeRequest('PUT', { name: 'New Name' })
    const response = await PUT(req, makeContext())
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// DELETE /api/locations/[id] — unauthenticated
// ============================================================================

describe('DELETE /api/locations/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest('DELETE')
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// DELETE /api/locations/[id] — validation
// ============================================================================

describe('DELETE /api/locations/[id] — validation', () => {
  it('returns 404 when location not found', async () => {
    mockWhere.mockReturnValueOnce(Promise.resolve([]))
    const req = makeRequest('DELETE')
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 403 when user does not own location', async () => {
    mockWhere.mockReturnValueOnce(Promise.resolve([{ ...MOCK_LOCATION_STUB, createdBy: 'other-user' }]))
    const req = makeRequest('DELETE')
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(403)
  })

  it('returns 400 when active bookings exist', async () => {
    mockWhere
      .mockReturnValueOnce(Promise.resolve([MOCK_LOCATION_STUB]))
      .mockReturnValueOnce(Promise.resolve([{ count: '3' }]))
    const req = makeRequest('DELETE')
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// DELETE /api/locations/[id] — success
// ============================================================================

describe('DELETE /api/locations/[id] — success', () => {
  it('returns 200 when owner deletes location with no active bookings', async () => {
    mockWhere
      .mockReturnValueOnce(Promise.resolve([MOCK_LOCATION_STUB]))
      .mockReturnValueOnce(Promise.resolve([{ count: '0' }]))
    const req = makeRequest('DELETE')
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(200)
    expect(mockDelete).toHaveBeenCalled()
  })
})
