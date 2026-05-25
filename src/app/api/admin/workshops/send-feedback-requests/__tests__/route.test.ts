/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/workshops/send-feedback-requests
 *
 * Behaviors locked:
 *   POST - 401, 400 (validation), 200 (no registrations), 200 (with registrations, tracks sent/failed)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler
    return (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return (handler as (r: Request, s: unknown) => unknown)(req, session)
      })
  },
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockValidateBody = jest.fn()
const mockSendEmail = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
  },
}))

jest.mock('@/db/schema', () => ({
  workshopRegistrations: { id: 'wr_id', workshopInstanceId: 'wr_instanceId', userId: 'wr_userId', status: 'wr_status', attended: 'wr_attended', rating: 'wr_rating', feedback: 'wr_feedback' },
  workshopInstances: { id: 'wi_id', workshopId: 'wi_workshopId', startDate: 'wi_startDate' },
  workshops: { id: 'w_id', title: 'w_title', slug: 'w_slug' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  lt: (a: unknown, b: unknown) => ({ __lt: [a, b] }),
  gte: (a: unknown, b: unknown) => ({ __gte: [a, b] }),
  isNull: (col: unknown) => ({ __isNull: col }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/workshop-registration-status', () => ({
  WORKSHOP_REGISTRATION_STATUS: { ATTENDED: 'attended', CONFIRMED: 'confirmed' },
}))

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  AdminSendFeedbackRequestsSchema: {},
}))

jest.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail.apply(null, args),
}))

jest.mock('@/lib/date-formats', () => ({
  formatDateWithWeekday: (_date: unknown) => 'Montag, 1. Juni 2026',
}))

jest.mock('@/config/urls', () => ({
  APP_URL: 'https://revamp-it.ch',
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_REGISTRATIONS = [
  { instance_id: 'inst-1', workshop_title: 'Laptop Repair', workshop_slug: 'laptop-repair', start_date: new Date('2026-05-01'), user_id: 'u-1', user_name: 'Hans', user_email: 'hans@example.com', registration_id: 'reg-1' },
  { instance_id: 'inst-1', workshop_title: 'Laptop Repair', workshop_slug: 'laptop-repair', start_date: new Date('2026-05-01'), user_id: 'u-2', user_name: 'Anna', user_email: 'anna@example.com', registration_id: 'reg-2' },
]

function makeRequest(body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/workshops/send-feedback-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? { daysAfterWorkshop: 3 }),
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockValidateBody.mockReturnValue({ success: true, data: { daysAfterWorkshop: 3 } })

  // 4-join query chain: from → innerJoin × 3 → where → orderBy (terminal)
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin })
  mockInnerJoin.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockResolvedValue([])

  mockSendEmail.mockResolvedValue({ success: true })
})

describe('POST /api/admin/workshops/send-feedback-requests — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/workshops/send-feedback-requests — validation', () => {
  it('returns 400 when body validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Invalid' }, { status: 400 }),
    })
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/admin/workshops/send-feedback-requests — success', () => {
  it('returns 200 with zero sent when no completed registrations', async () => {
    const response = await POST(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.total).toBe(0)
    expect(body.data.sent).toBe(0)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('returns 200 and reports sent/failed counts', async () => {
    mockOrderBy.mockResolvedValueOnce(MOCK_REGISTRATIONS)
    mockSendEmail
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error('SMTP error'))

    const response = await POST(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.total).toBe(2)
    expect(body.data.sent).toBe(1)
    expect(body.data.failed).toBe(1)
    expect(mockSendEmail).toHaveBeenCalledTimes(2)
  })

  it('counts resolved {success:false} as failed (was miscounted as sent before this fix)', async () => {
    // Promise.allSettled's `fulfilled` only means "promise resolved", not
    // "email sent" — sendEmail RESOLVES with {success:false} on realistic
    // failures (SMTP rejection, Listmonk disabled, API non-2xx). The prior
    // settled.status==='fulfilled' check counted those as sent. This test
    // locks in the settled.value.success check.
    mockOrderBy.mockResolvedValueOnce(MOCK_REGISTRATIONS)
    mockSendEmail
      .mockResolvedValueOnce({ success: false, error: 'SMTP rejected' })
      .mockResolvedValueOnce({ success: false, error: 'Listmonk disabled' })

    const response = await POST(makeRequest())
    const body = await response.json()
    expect(body.data.total).toBe(2)
    expect(body.data.sent).toBe(0)
    expect(body.data.failed).toBe(2)
  })
})
