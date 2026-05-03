/**
 * @jest-environment node
 *
 * Tests for GET /api/locations/[id]/bookings and POST /api/locations/[id]/bookings
 * Note: uses auth() directly (not withAuth middleware).
 *
 * Behaviors locked:
 *   GET  - 401, 404, 403 (not approved), 200
 *   POST - 401, 400 (validation), 404, 403 (not approved), 400 (conflict), 200/201
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
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  locations: {
    id: 'loc_id', name: 'loc_name', approvalStatus: 'loc_approvalStatus',
    maxCapacity: 'loc_maxCapacity', usageCount: 'loc_usageCount',
    lastUsedAt: 'loc_lastUsedAt',
  },
  locationBookings: {
    id: 'lb_id', locationId: 'lb_locationId', bookedBy: 'lb_bookedBy',
    eventType: 'lb_eventType', eventId: 'lb_eventId', title: 'lb_title',
    description: 'lb_description', startTime: 'lb_startTime', endTime: 'lb_endTime',
    expectedAttendees: 'lb_expectedAttendees', specialRequirements: 'lb_specialRequirements',
    status: 'lb_status',
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
  gte: (a: unknown, b: unknown) => ({ __gte: [a, b] }),
  lte: (a: unknown, b: unknown) => ({ __lte: [a, b] }),
  desc: (a: unknown) => ({ __desc: a }),
  inArray: (a: unknown, b: unknown) => ({ __inArray: [a, b] }),
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

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  CreateLocationBookingSchema: {},
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
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

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

const MOCK_LOCATION_APPROVED = {
  id: 'loc-1',
  approvalStatus: 'approved',
  maxCapacity: 20,
}

const MOCK_LOCATION_PENDING = {
  id: 'loc-1',
  approvalStatus: 'pending',
  maxCapacity: 20,
}

const MOCK_BOOKING = {
  id: 'booking-1',
  locationId: 'loc-1',
  bookedBy: 'user-1',
  eventType: 'workshop',
  title: 'Repair Workshop',
  startTime: new Date(Date.now() + 86400000).toISOString(),  // tomorrow
  endTime: new Date(Date.now() + 90000000).toISOString(),
  status: 'pending',
}

// A future date for POST booking tests
const FUTURE_START = new Date(Date.now() + 86400000 * 7).toISOString() // 1 week from now
const FUTURE_END = new Date(Date.now() + 86400000 * 7 + 3600000).toISOString() // 1 week + 1hr

const VALID_BOOKING_BODY = {
  event_type: 'workshop',
  title: 'Test Workshop',
  description: 'A test workshop',
  start_time: FUTURE_START,
  end_time: FUTURE_END,
  expected_attendees: 10,
}

function makeContext(id = 'loc-1') {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(method = 'GET', body?: unknown, url = 'http://localhost/api/locations/loc-1/bookings') {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockValidateBody.mockReturnValue({ success: true, data: VALID_BOOKING_BODY })

  mockReturning.mockResolvedValue([MOCK_BOOKING])
  mockValues.mockReturnValue({ returning: mockReturning })
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)

  // Default select chain for bookings GET
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockLimit.mockResolvedValue([{ booking: MOCK_BOOKING, bookedByName: 'Test User', bookedByEmail: 'user@example.com', locationName: 'RevampIT Zürich' }])
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockFrom.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere, orderBy: mockOrderBy })
  mockSelect.mockReturnValue({ from: mockFrom })
})

// ============================================================================
// GET /api/locations/[id]/bookings — unauthenticated
// ============================================================================

describe('GET /api/locations/[id]/bookings — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// GET /api/locations/[id]/bookings — not found / forbidden
// ============================================================================

describe('GET /api/locations/[id]/bookings — not found / forbidden', () => {
  it('returns 404 when location does not exist', async () => {
    // First select (location check) returns empty
    let selectCallCount = 0
    mockSelect.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        const mockLocWhere = jest.fn().mockResolvedValue([])
        return { from: jest.fn().mockReturnValue({ where: mockLocWhere }) }
      }
      return { from: mockFrom }
    })
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 403 when location is not approved', async () => {
    let selectCallCount = 0
    mockSelect.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        const mockLocWhere = jest.fn().mockResolvedValue([MOCK_LOCATION_PENDING])
        return { from: jest.fn().mockReturnValue({ where: mockLocWhere }) }
      }
      return { from: mockFrom }
    })
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(403)
  })
})

// ============================================================================
// GET /api/locations/[id]/bookings — success
// ============================================================================

describe('GET /api/locations/[id]/bookings — success', () => {
  it('returns 200 with bookings list', async () => {
    // Route GET chain:
    // 1) db.select().from(locations).where(eq) → [MOCK_LOCATION_APPROVED]
    // 2) db.select().from(locationBookings).leftJoin(...).leftJoin(...).where(...).orderBy() → [bookings]
    //    terminal call is orderBy(), not limit/offset
    const mockBookingsOrderBy = jest.fn().mockResolvedValue([
      { booking: MOCK_BOOKING, bookedByName: 'Test User', bookedByEmail: 'user@example.com', locationName: 'RevampIT Zürich' }
    ])
    let selectCallCount = 0
    mockSelect.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        // location check
        const mockLocWhere = jest.fn().mockResolvedValue([MOCK_LOCATION_APPROVED])
        return { from: jest.fn().mockReturnValue({ where: mockLocWhere }) }
      }
      // bookings query: .from().leftJoin().leftJoin().where().orderBy() -> Promise
      const mockBookingsWhere = jest.fn().mockReturnValue({ orderBy: mockBookingsOrderBy })
      const mockBookingsLeftJoin = jest.fn()
      mockBookingsLeftJoin.mockReturnValue({ leftJoin: mockBookingsLeftJoin, where: mockBookingsWhere })
      const mockBookingsFrom = jest.fn().mockReturnValue({ leftJoin: mockBookingsLeftJoin })
      return { from: mockBookingsFrom }
    })
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('bookings')
    expect(body.data).toHaveProperty('location')
  })
})

// ============================================================================
// POST /api/locations/[id]/bookings — unauthenticated
// ============================================================================

describe('POST /api/locations/[id]/bookings — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest('POST', VALID_BOOKING_BODY)
    const response = await POST(req, makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// POST /api/locations/[id]/bookings — validation
// ============================================================================

describe('POST /api/locations/[id]/bookings — validation', () => {
  it('returns 400 when body validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 }),
    })
    const req = makeRequest('POST', {})
    const response = await POST(req, makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when end_time is before start_time', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: {
        ...VALID_BOOKING_BODY,
        start_time: FUTURE_END,   // swapped
        end_time: FUTURE_START,
      },
    })
    const req = makeRequest('POST', {})
    const response = await POST(req, makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when start_time is in the past', async () => {
    const pastStart = new Date(Date.now() - 86400000).toISOString()
    const pastEnd = new Date(Date.now() - 82800000).toISOString()
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { ...VALID_BOOKING_BODY, start_time: pastStart, end_time: pastEnd },
    })
    const req = makeRequest('POST', {})
    const response = await POST(req, makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when location does not exist', async () => {
    let selectCallCount = 0
    mockSelect.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        const mockLocWhere = jest.fn().mockResolvedValue([])
        return { from: jest.fn().mockReturnValue({ where: mockLocWhere }) }
      }
      return { from: mockFrom }
    })
    const req = makeRequest('POST', VALID_BOOKING_BODY)
    const response = await POST(req, makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 403 when location is not approved', async () => {
    let selectCallCount = 0
    mockSelect.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        const mockLocWhere = jest.fn().mockResolvedValue([MOCK_LOCATION_PENDING])
        return { from: jest.fn().mockReturnValue({ where: mockLocWhere }) }
      }
      return { from: mockFrom }
    })
    const req = makeRequest('POST', VALID_BOOKING_BODY)
    const response = await POST(req, makeContext())
    expect(response.status).toBe(403)
  })

  it('returns 400 when expected attendees exceed capacity', async () => {
    let selectCallCount = 0
    mockSelect.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        const mockLocWhere = jest.fn().mockResolvedValue([{ ...MOCK_LOCATION_APPROVED, maxCapacity: 5 }])
        return { from: jest.fn().mockReturnValue({ where: mockLocWhere }) }
      }
      return { from: mockFrom }
    })
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { ...VALID_BOOKING_BODY, expected_attendees: 10 },
    })
    const req = makeRequest('POST', VALID_BOOKING_BODY)
    const response = await POST(req, makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when booking conflicts with existing booking', async () => {
    const conflictBooking = {
      id: 'existing-booking',
      title: 'Existing Event',
      startTime: FUTURE_START,
      endTime: FUTURE_END,
    }
    let selectCallCount = 0
    mockSelect.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        // location check
        const mockLocWhere = jest.fn().mockResolvedValue([MOCK_LOCATION_APPROVED])
        return { from: jest.fn().mockReturnValue({ where: mockLocWhere }) }
      }
      // conflict check
      return { from: mockFrom }
    })
    mockWhere.mockReturnValueOnce(Promise.resolve([conflictBooking]))
    const req = makeRequest('POST', VALID_BOOKING_BODY)
    const response = await POST(req, makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('Zeitkonflikt')
  })
})

// ============================================================================
// POST /api/locations/[id]/bookings — success
// ============================================================================

describe('POST /api/locations/[id]/bookings — success', () => {
  it('creates booking and returns 200', async () => {
    let selectCallCount = 0
    mockSelect.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        // location check
        const mockLocWhere = jest.fn().mockResolvedValue([MOCK_LOCATION_APPROVED])
        return { from: jest.fn().mockReturnValue({ where: mockLocWhere }) }
      }
      // conflict check — no conflicts
      return { from: mockFrom }
    })
    mockWhere.mockReturnValueOnce(Promise.resolve([]))  // no conflicts

    const req = makeRequest('POST', VALID_BOOKING_BODY)
    const response = await POST(req, makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('booking')
    expect(mockInsert).toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalled() // usage stats update
  })
})
