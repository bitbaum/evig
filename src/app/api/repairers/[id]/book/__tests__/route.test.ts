/**
 * @jest-environment node
 *
 * Tests for POST /api/repairers/[id]/book (withAuth)
 *
 * Behaviors locked:
 *   POST - 401, 404 (not found), 400 (inactive), 400 (own repairer), 201 (success)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<unknown> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext)
      }),
}))

const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockTransaction = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  repairerProfiles: {
    id: 'rp_id',
    userId: 'rp_userId',
    businessName: 'rp_businessName',
    status: 'rp_status',
    isActive: 'rp_isActive',
  },
  serviceAppointments: {
    id: 'sa_id',
    userId: 'sa_userId',
    serviceTypeId: 'sa_serviceTypeId',
    repairerId: 'sa_repairerId',
    repairerProfileId: 'sa_repairerProfileId',
    description: 'sa_description',
    deviceInfo: 'sa_deviceInfo',
    preferredDate: 'sa_preferredDate',
    urgency: 'sa_urgency',
    status: 'sa_status',
    isHomeVisit: 'sa_isHomeVisit',
    visitAddress: 'sa_visitAddress',
    visitPostalCode: 'sa_visitPostalCode',
    visitCity: 'sa_visitCity',
    createdAt: 'sa_createdAt',
  },
  serviceTypes: {
    id: 'st_id',
    name: 'st_name',
    slug: 'st_slug',
    requiresApproval: 'st_requiresApproval',
    isActive: 'st_isActive',
    description: 'st_description',
  },
  repairerAvailability: {
    id: 'rav_id',
    repairerId: 'rav_repairerId',
    date: 'rav_date',
    startTime: 'rav_startTime',
    endTime: 'rav_endTime',
    availabilityType: 'rav_availabilityType',
    bookingId: 'rav_bookingId',
    updatedAt: 'rav_updatedAt',
  },
  users: { id: 'u_id', email: 'u_email', name: 'u_name' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, details?: unknown) => NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error',
    REPAIRER_NOT_FOUND: 'Reparateur nicht gefunden', },
}))

jest.mock('@/config/booking-status', () => ({
  BOOKING_STATUS: { REQUESTED: 'requested' },
}))

jest.mock('@/config/it-hilfe', () => ({
  URGENCY_DEFAULT: 'normal',
}))

jest.mock('@/config/repairer-status', () => ({
  REPAIRER_STATUS: { ACTIVE: 'active' },
  REPAIRER_AVAILABILITY_TYPE: { AVAILABLE: 'available', BOOKED: 'booked' },
}))

jest.mock('@/config/urls', () => ({ APP_URL: 'https://example.com' }))

jest.mock('@/lib/email', () => ({
  sendCustomEmail: jest.fn().mockResolvedValue({ success: true }),
  appointmentNewBooking: jest.fn().mockReturnValue({}),
}))

jest.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: { bookingCreate: jest.fn().mockReturnValue(true) },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_REPAIRER = {
  id: 'repairer-1',
  userId: 'other-user',
  businessName: 'Fix-It Shop',
  status: 'active',
  isActive: true,
}

const MOCK_SERVICE_TYPE = {
  id: 'st-1',
  name: 'Computer Reparatur',
  slug: 'computer_repair',
  requiresApproval: false,
}

const VALID_BODY = {
  service_category: 'computer_repair',
  description: 'Laptop broken',
}

function makeContext(id = 'repairer-1') {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/repairers/repairer-1/book', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockReturning.mockResolvedValue([{ id: 'appt-1', createdAt: new Date() }])
  mockValues.mockReturnValue({ returning: mockReturning, onConflictDoUpdate: jest.fn().mockReturnValue({ returning: mockReturning }) })
  mockSet.mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) })
  const { rateLimiters } = jest.requireMock('@/lib/security/rate-limit') as { rateLimiters: { bookingCreate: jest.Mock } }
  rateLimiters.bookingCreate.mockReturnValue(true)
  // Re-wire fire-and-forget email mock so .catch() doesn't throw
  const emailMocks = jest.requireMock('@/lib/email') as { sendCustomEmail: jest.Mock; appointmentNewBooking: jest.Mock }
  emailMocks.sendCustomEmail.mockResolvedValue({ success: true })
  emailMocks.appointmentNewBooking.mockReturnValue({})
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
    const txInsert = jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 'appt-1', createdAt: new Date() }]),
      }),
    })
    const txUpdate = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    })
    return fn({ insert: txInsert, update: txUpdate, execute: jest.fn().mockResolvedValue({ rows: [] }) })
  })
})

describe('POST /api/repairers/[id]/book — unauthenticated', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const res = await POST(makeRequest(VALID_BODY), makeContext())
    expect(res.status).toBe(401)
  })
})

describe('POST /api/repairers/[id]/book — validation', () => {
  it('returns 400 when service_category is missing', async () => {
    // First select: repairer found
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_REPAIRER]),
      }),
    })
    const res = await POST(makeRequest({ description: 'Help' }), makeContext())
    expect(res.status).toBe(400)
  })

  it('returns 400 when description is missing', async () => {
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_REPAIRER]),
      }),
    })
    const res = await POST(makeRequest({ service_category: 'computer_repair' }), makeContext())
    expect(res.status).toBe(400)
  })

  it('returns 404 when repairer not found', async () => {
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    })
    const res = await POST(makeRequest(VALID_BODY), makeContext())
    expect(res.status).toBe(404)
  })

  it('returns 400 when repairer is inactive', async () => {
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ ...MOCK_REPAIRER, isActive: false }]),
      }),
    })
    const res = await POST(makeRequest(VALID_BODY), makeContext())
    expect(res.status).toBe(400)
  })

  it('returns 400 when booking own repairer profile', async () => {
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ ...MOCK_REPAIRER, userId: 'user-1' }]),
      }),
    })
    const res = await POST(makeRequest(VALID_BODY), makeContext())
    expect(res.status).toBe(400)
  })
})

describe('POST /api/repairers/[id]/book — success', () => {
  it('returns 200 when appointment is created', async () => {
    // 1. Repairer found
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_REPAIRER]),
      }),
    })
    // 2. Service type found by slug
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_SERVICE_TYPE]),
      }),
    })
    // 3. Repairer user for email notification
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ email: 'repairer@example.com', name: 'Repairer' }]),
      }),
    })

    const res = await POST(makeRequest(VALID_BODY), makeContext())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.appointment.id).toBe('appt-1')
  })

  it('repairer notification email links to /dashboard/appointments?role=repairer (the hook now honors the role param)', async () => {
    // useAppointments now forwards ?role=repairer to /api/appointments
    // (which has always supported the role filter), so the repairer
    // landing-URL no longer needs the /dashboard/techniker stopgap.
    // The page renders the repairer's service-appointment workload
    // when ?role=repairer is set; without it the page defaults to the
    // customer-side bookings as before.
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_REPAIRER]),
      }),
    })
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_SERVICE_TYPE]),
      }),
    })
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ email: 'repairer@example.com', name: 'Repairer' }]),
      }),
    })

    await POST(makeRequest(VALID_BODY), makeContext())
    // Flush the fire-and-forget chain
    await new Promise(resolve => setImmediate(resolve))

    const emailMocks = jest.requireMock('@/lib/email') as { appointmentNewBooking: jest.Mock }
    expect(emailMocks.appointmentNewBooking).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.stringMatching(/\/dashboard\/appointments\?role=repairer$/),
    )
  })
})
