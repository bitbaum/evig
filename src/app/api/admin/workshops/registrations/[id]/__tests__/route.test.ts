/**
 * @jest-environment node
 *
 * Tests for PUT /api/admin/workshops/registrations/[id]
 *
 * Behaviors locked:
 *   PUT - 401, 400 (validation), 404, 400 (no fields), 200 (no email), 200 (with email)
 */

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
        const resolvedContext = context?.params ? { params: await context.params } : undefined
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
const mockValidateBody = jest.fn()
const mockSendEmail = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  workshopRegistrations: { id: 'wr_id', workshopInstanceId: 'wr_instanceId', userId: 'wr_userId', status: 'wr_status', attended: 'wr_attended', notes: 'wr_notes', confirmedAt: 'wr_confirmedAt', cancelledAt: 'wr_cancelledAt' },
  workshopInstances: { id: 'wi_id', workshopId: 'wi_workshopId', startDate: 'wi_startDate' },
  workshops: { id: 'w_id', title: 'w_title' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/workshop-registration-status', () => ({
  WORKSHOP_REGISTRATION_STATUS: { CONFIRMED: 'confirmed', CANCELLED: 'cancelled', WAITLIST: 'waitlist', PENDING: 'pending', ATTENDED: 'attended' },
}))

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  AdminWorkshopRegistrationUpdateSchema: {},
}))

jest.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail.apply(null, args),
}))

jest.mock('@/lib/date-formats', () => ({
  formatDateTimeWithWeekday: (_date: unknown) => 'Montag, 1. Juni 2026, 10:00',
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { PUT } from '../route'

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_EMAIL_DETAILS = {
  userId: 'u-1', userName: 'Hans', userEmail: 'hans@example.com',
  workshopTitle: 'Laptop Repair', startDate: new Date('2026-06-01T10:00:00Z'),
}

function makeRequest(body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/workshops/registrations/reg-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
}

function makeContext(id = 'reg-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Default: validateBody succeeds with status=attended (no email)
  mockValidateBody.mockReturnValue({ success: true, data: { status: 'attended' } })

  // Existence check: from → where (terminal)
  // Email details query: from → innerJoin × 3 → where (terminal)
  mockFrom.mockReturnValue({ where: mockWhere, innerJoin: mockInnerJoin })
  mockInnerJoin.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
  mockWhere.mockResolvedValue([{ id: 'reg-1' }])

  // Update chain: set → where (terminal)
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)

  mockSendEmail.mockResolvedValue({ success: true })
})

describe('PUT /api/admin/workshops/registrations/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PUT(makeRequest({ status: 'confirmed' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PUT /api/admin/workshops/registrations/[id] — validation', () => {
  it('returns 400 when body validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 }),
    })
    const response = await PUT(makeRequest({}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when registration not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await PUT(makeRequest({ status: 'confirmed' }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when no fields to update', async () => {
    mockValidateBody.mockReturnValueOnce({ success: true, data: {} })
    const response = await PUT(makeRequest({}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PUT /api/admin/workshops/registrations/[id] — success', () => {
  it('returns 200 without sending email for attended status', async () => {
    const response = await PUT(makeRequest({ status: 'attended' }), makeContext())
    expect(response.status).toBe(200)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('returns 200 and sends email when status is confirmed', async () => {
    mockValidateBody.mockReturnValueOnce({ success: true, data: { status: 'confirmed' } })
    // First mockWhere call: existence check → [{ id }]
    // Second mockWhere call: email details query → [MOCK_EMAIL_DETAILS]
    mockWhere
      .mockResolvedValueOnce([{ id: 'reg-1' }])
      .mockResolvedValueOnce([MOCK_EMAIL_DETAILS])
    const response = await PUT(makeRequest({ status: 'confirmed' }), makeContext())
    expect(response.status).toBe(200)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })
})
