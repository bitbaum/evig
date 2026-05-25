/**
 * @jest-environment node
 *
 * Tests for POST /api/it-hilfe/requests/[id]/complete (withAuth)
 */

// ── Auth mock ──────────────────────────────────────────────────────────────

const mockAuth = jest.fn()

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext)
      }),
}))

// ── DB mocks ───────────────────────────────────────────────────────────────

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockTransaction = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  itHilfeRequests: { id: 'ihr_id', requesterId: 'ihr_requesterId', status: 'ihr_status', title: 'ihr_title', matchedOfferId: 'ihr_matchedOfferId', completedAt: 'ihr_completedAt', completedBy: 'ihr_completedBy' },
  itHilfeOffers: { id: 'iho_id', helperId: 'iho_helperId', status: 'iho_status' },
  repairerProfiles: { id: 'rp_id', userId: 'rp_userId', totalJobsCompleted: 'rp_totalJobsCompleted' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiForbidden: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 403 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { UNAUTHORIZED: 'Unauthorized', INTERNAL_SERVER_ERROR: 'Server error' },
}))

jest.mock('@/config/it-hilfe', () => ({
  REQUEST_STATUS: { OPEN: 'open', MATCHED: 'matched', COMPLETED: 'completed' },
  OFFER_STATUS: { PENDING: 'pending', ACCEPTED: 'accepted', REJECTED: 'rejected', WITHDRAWN: 'withdrawn' },
}))

jest.mock('@/lib/it-hilfe/notifications', () => ({
  sendItHilfeNotification: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/email', () => ({
  sendCustomEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/email/templates/it-hilfe', () => ({
  itHilfeCompleted: jest.fn().mockReturnValue({}),
}))

jest.mock('@/config/urls', () => ({ APP_URL: 'https://example.com' }))

// ── Fixtures ───────────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const VALID_OFFER_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
const MOCK_SESSION = {
  user: { id: 'helper-user', email: 'helper@example.com', name: 'Helper User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ── Helpers ────────────────────────────────────────────────────────────────

const routeParams = (id: string) => ({ params: Promise.resolve({ id }) })

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/it-hilfe/requests/${id}/complete`, {
    method: 'POST',
  })
}

function setupTwoSelectChain(row1: unknown | null, row2: unknown | null) {
  // First select: request + user join
  mockSelect.mockReturnValueOnce({
    from: jest.fn().mockReturnValue({
      innerJoin: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(row1 ? [row1] : []),
      }),
    }),
  })
  // Second select: offer
  mockSelect.mockReturnValueOnce({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(row2 ? [row2] : []),
    }),
  })
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/it-hilfe/requests/[id]/complete', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockUpdateWhere.mockResolvedValue(undefined)
    mockSet.mockReturnValue({ where: mockUpdateWhere })
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const txUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
      })
      return fn({ update: txUpdate })
    })
    // Re-establish fire-and-forget mocks cleared by resetAllMocks
    const email = jest.requireMock('@/lib/email') as { sendCustomEmail: jest.Mock }
    email.sendCustomEmail.mockResolvedValue(undefined)
    const notif = jest.requireMock('@/lib/it-hilfe/notifications') as { sendItHilfeNotification: jest.Mock }
    notif.sendItHilfeNotification.mockResolvedValue(undefined)
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await POST(makeRequest(VALID_UUID), routeParams(VALID_UUID))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid UUID', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)

    const res = await POST(makeRequest('bad-id'), routeParams('bad-id'))
    expect(res.status).toBe(400)
  })

  it('returns 404 when request not found', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupTwoSelectChain(null, null)

    const res = await POST(makeRequest(VALID_UUID), routeParams(VALID_UUID))
    expect(res.status).toBe(404)
  })

  it('returns 400 when request status is not matched', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupTwoSelectChain(
      { requestId: VALID_UUID, requesterId: 'requester-1', requesterName: 'Requester', requesterEmail: 'req@example.com', title: 'Fix laptop', status: 'open', matchedOfferId: VALID_OFFER_UUID },
      null
    )

    const res = await POST(makeRequest(VALID_UUID), routeParams(VALID_UUID))
    expect(res.status).toBe(400)
  })

  it('returns 403 when user is not the matched helper', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupTwoSelectChain(
      { requestId: VALID_UUID, requesterId: 'requester-1', requesterName: 'Requester', requesterEmail: 'req@example.com', title: 'Fix laptop', status: 'matched', matchedOfferId: VALID_OFFER_UUID },
      { id: VALID_OFFER_UUID, helperId: 'different-helper', status: 'accepted' }
    )

    const res = await POST(makeRequest(VALID_UUID), routeParams(VALID_UUID))
    expect(res.status).toBe(403)
  })

  it('returns 200 when helper marks request as completed', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupTwoSelectChain(
      { requestId: VALID_UUID, requesterId: 'requester-1', requesterName: 'Requester', requesterEmail: 'req@example.com', title: 'Fix laptop', status: 'matched', matchedOfferId: VALID_OFFER_UUID },
      { id: VALID_OFFER_UUID, helperId: 'helper-user', status: 'accepted' }
    )

    const res = await POST(makeRequest(VALID_UUID), routeParams(VALID_UUID))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })
})
