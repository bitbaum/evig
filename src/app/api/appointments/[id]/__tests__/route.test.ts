/**
 * @jest-environment node
 *
 * Tests for GET /api/appointments/[id] and PATCH /api/appointments/[id]
 *
 * Behaviors locked:
 *   GET   - 401, 400 (missing id), 404, 403 (not owner/repairer), 200
 *   PATCH - 401, 400 (missing id), 404, 403 (permission error), 400 (bad action), 200
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
  serviceAppointments: {
    id: 'sa_id', userId: 'sa_userId', repairerId: 'sa_repairerId', repairerProfileId: 'sa_repairerProfileId',
    serviceTypeId: 'sa_serviceTypeId', description: 'sa_description', deviceInfo: 'sa_deviceInfo',
    preferredDate: 'sa_preferredDate', confirmedDate: 'sa_confirmedDate', urgency: 'sa_urgency',
    status: 'sa_status', outcomeNotes: 'sa_outcomeNotes', priceChargedCents: 'sa_priceChargedCents',
    estimatedDurationHours: 'sa_estimatedDurationHours', quotedPriceChf: 'sa_quotedPriceChf',
    quoteApproved: 'sa_quoteApproved', quoteApprovedAt: 'sa_quoteApprovedAt',
    diagnosisNotes: 'sa_diagnosisNotes', partsNeeded: 'sa_partsNeeded', partsOrderedAt: 'sa_partsOrderedAt',
    completedAt: 'sa_completedAt', completionNotes: 'sa_completionNotes', customerRating: 'sa_customerRating',
    customerReview: 'sa_customerReview', reviewedAt: 'sa_reviewedAt', lastContactAt: 'sa_lastContactAt',
    messagesCount: 'sa_messagesCount', isHomeVisit: 'sa_isHomeVisit', visitAddress: 'sa_visitAddress',
    visitPostalCode: 'sa_visitPostalCode', visitCity: 'sa_visitCity',
    createdAt: 'sa_createdAt', updatedAt: 'sa_updatedAt',
  },
  serviceTypes: { id: 'st_id', name: 'st_name' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
  repairerProfiles: { id: 'rp_id', businessName: 'rp_businessName', phone: 'rp_phone' },
}))

jest.mock('drizzle-orm/pg-core', () => ({
  alias: (_t: unknown, name: string) => ({ id: `${name}_id`, name: `${name}_name`, email: `${name}_email` }),
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), { raw: (s: string) => ({ __raw: s }) }),
  desc: (a: unknown) => ({ __desc: a }),
  isNull: (a: unknown) => ({ __isNull: a }),
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

const mockValidateBody = jest.fn((_schema: unknown, data: unknown) => ({ success: true, data }))

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  AppointmentActionSchema: {},
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}))

jest.mock('@/lib/services/appointment-actions', () => ({
  buildActionUpdate: jest.fn(),
  executeAppointmentUpdate: jest.fn(),
  sendAppointmentNotification: jest.fn().mockResolvedValue(undefined),
}))

import { NextRequest } from 'next/server'
import { GET, PATCH } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_APPOINTMENT = {
  id: 'appt-1',
  user_id: 'user-1',
  repairer_id: 'repairer-1',
  service_type_id: 'svc-1',
  description: 'Laptop reparieren',
  status: 'requested',
  urgency: 'normal',
  created_at: new Date(),
  updated_at: new Date(),
  customer_name: 'Test User',
  customer_email: 'user@example.com',
  repairer_name: 'Repairer Name',
  business_name: 'Repair Shop',
  service_name: 'Laptop Repair',
}

function makeSelectChain(rows: unknown[]) {
  const where = jest.fn().mockResolvedValue(rows)
  const leftJoin = jest.fn()
  leftJoin.mockReturnValue({ leftJoin, where })
  const from = jest.fn().mockReturnValue({ leftJoin, where })
  return { from }
}

function makeContext(id = 'appt-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockValidateBody.mockImplementation((_schema: unknown, data: unknown) => ({ success: true, data }))
  mockSelect.mockReturnValue(makeSelectChain([MOCK_APPOINTMENT]))
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue([MOCK_APPOINTMENT])

  const { sendAppointmentNotification, buildActionUpdate, executeAppointmentUpdate } = jest.requireMock('@/lib/services/appointment-actions')
  sendAppointmentNotification.mockResolvedValue(undefined)
  buildActionUpdate.mockReturnValue({ updateSet: {}, newStatus: null })
  executeAppointmentUpdate.mockResolvedValue({ ...MOCK_APPOINTMENT })
})

// ============================================================================
// GET — single appointment
// ============================================================================

describe('GET /api/appointments/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/appointments/appt-1')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/appointments/[id] — not found', () => {
  it('returns 404 when appointment does not exist', async () => {
    mockSelect.mockReturnValueOnce(makeSelectChain([]))
    const req = new NextRequest('http://localhost/api/appointments/appt-1')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(404)
  })
})

describe('GET /api/appointments/[id] — authorization', () => {
  it('returns 403 when user is neither customer nor repairer', async () => {
    mockSelect.mockReturnValueOnce(makeSelectChain([{ ...MOCK_APPOINTMENT, user_id: 'other-user', repairer_id: 'other-repairer' }]))
    const req = new NextRequest('http://localhost/api/appointments/appt-1')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(403)
  })
})

describe('GET /api/appointments/[id] — success', () => {
  it('returns 200 with appointment for customer', async () => {
    const req = new NextRequest('http://localhost/api/appointments/appt-1')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.appointment.id).toBe('appt-1')
  })

  it('returns 200 with appointment for repairer', async () => {
    mockAuth.mockResolvedValueOnce({ ...MOCK_SESSION, user: { ...MOCK_SESSION.user, id: 'repairer-1' } })
    const req = new NextRequest('http://localhost/api/appointments/appt-1')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// PATCH — update appointment
// ============================================================================

describe('PATCH /api/appointments/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/appointments/appt-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'accept' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/appointments/[id] — validation', () => {
  it('returns 404 when appointment does not exist', async () => {
    mockSelect.mockReturnValueOnce(makeSelectChain([]))
    const req = new NextRequest('http://localhost/api/appointments/appt-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'accept' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 403 when buildActionUpdate returns a permission error', async () => {
    const { buildActionUpdate } = jest.requireMock('@/lib/services/appointment-actions')
    buildActionUpdate.mockReturnValueOnce({ error: 'Kein Zugriff auf diesen Termin' })

    const req = new NextRequest('http://localhost/api/appointments/appt-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'accept' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, makeContext())
    expect(response.status).toBe(403)
  })

  it('returns 400 when buildActionUpdate returns a non-permission error', async () => {
    const { buildActionUpdate } = jest.requireMock('@/lib/services/appointment-actions')
    buildActionUpdate.mockReturnValueOnce({ error: 'Ungültige Aktion' })

    const req = new NextRequest('http://localhost/api/appointments/appt-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'invalid' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when trying to re-rate an already-rated appointment', async () => {
    const { buildActionUpdate, executeAppointmentUpdate } = jest.requireMock('@/lib/services/appointment-actions')
    buildActionUpdate.mockReturnValueOnce({ updateSet: {}, newStatus: null })
    // null returned from executeAppointmentUpdate when action=rate means already rated
    executeAppointmentUpdate.mockResolvedValueOnce(null)

    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { action: 'rate', customer_rating: 5 },
    })

    const req = new NextRequest('http://localhost/api/appointments/appt-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'rate', customer_rating: 5 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/appointments/[id] — success', () => {
  it('returns 200 with updated appointment', async () => {
    const { buildActionUpdate, executeAppointmentUpdate } = jest.requireMock('@/lib/services/appointment-actions')
    buildActionUpdate.mockReturnValueOnce({ updateSet: { status: 'accepted' }, newStatus: 'accepted' })
    executeAppointmentUpdate.mockResolvedValueOnce({ ...MOCK_APPOINTMENT, status: 'accepted' })

    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { action: 'accept' },
    })

    const req = new NextRequest('http://localhost/api/appointments/appt-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'accept' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.message).toBe('Termin aktualisiert')
  })
})
