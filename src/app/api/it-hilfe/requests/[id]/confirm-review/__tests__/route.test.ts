/**
 * @jest-environment node
 *
 * Tests for POST /api/it-hilfe/requests/[id]/confirm-review (withAuth)
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
  itHilfeRequests: { id: 'ihr_id', requesterId: 'ihr_requesterId', status: 'ihr_status', title: 'ihr_title', matchedOfferId: 'ihr_matchedOfferId', reviewedAt: 'ihr_reviewedAt' },
  itHilfeOffers: { id: 'iho_id', helperId: 'iho_helperId' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  getTableName: (_t: unknown) => 'it_hilfe_requests',
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

jest.mock('@/config/database', () => ({
  REVIEW_TARGET_TYPES: { IT_HILFE: 'it_hilfe', HELPER: 'helper' },
}))

jest.mock('@/config/it-hilfe', () => ({
  REQUEST_STATUS: { OPEN: 'open', MATCHED: 'matched', COMPLETED: 'completed' },
  // Mirror the SSOT constant added in NNN.4 — the route's length-check
  // guard would silently skip without it (NaN comparison always false).
  REVIEW_MIN_CHARS: 10,
}))

jest.mock('@/lib/reviews/create-review', () => ({
  createReview: jest.fn().mockResolvedValue({ reviewId: 'review-1' }),
  findDuplicateReview: jest.fn().mockResolvedValue(null),
}))

jest.mock('@/lib/it-hilfe/notifications', () => ({
  notifyReviewReceived: jest.fn(),
}))

// ── Fixtures ───────────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const VALID_OFFER_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}
const MOCK_REQUEST_ROW = {
  requestId: VALID_UUID,
  requesterId: 'user-1',
  title: 'Fix laptop',
  status: 'completed',
  reviewedAt: null,
  matchedOfferId: VALID_OFFER_UUID,
}
const MOCK_OFFER_ROW = {
  helperId: 'helper-1',
  helperName: 'Helper',
  helperEmail: 'helper@example.com',
}

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ── Helpers ────────────────────────────────────────────────────────────────

const routeParams = (id: string) => ({ params: Promise.resolve({ id }) })

function makeRequest(id: string, body: unknown) {
  return new NextRequest(`http://localhost/api/it-hilfe/requests/${id}/confirm-review`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function setupSelectChains(requestRow: unknown | null, offerRow: unknown | null) {
  // First select: request
  mockSelect.mockReturnValueOnce({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(requestRow ? [requestRow] : []),
    }),
  })
  // Second select: offer with innerJoin
  mockSelect.mockReturnValueOnce({
    from: jest.fn().mockReturnValue({
      innerJoin: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(offerRow ? [offerRow] : []),
      }),
    }),
  })
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/it-hilfe/requests/[id]/confirm-review', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockUpdateWhere.mockResolvedValue(undefined)
    mockSet.mockReturnValue({ where: mockUpdateWhere })
    // Default FOR UPDATE inside transaction returns reviewed_at=null so the
    // race-recheck passes for happy-path tests. Tests covering the race-
    // loser branch override via mockTransaction.mockImplementationOnce.
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const txUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
      })
      const txExecute = jest.fn().mockResolvedValue({ rows: [{ reviewed_at: null }] })
      return fn({ update: txUpdate, execute: txExecute })
    })
    // Re-establish default mocks that resetAllMocks clears
    const reviews = jest.requireMock('@/lib/reviews/create-review') as { createReview: jest.Mock; findDuplicateReview: jest.Mock }
    reviews.createReview.mockResolvedValue({ reviewId: 'review-1' })
    reviews.findDuplicateReview.mockResolvedValue(null)
    const notif = jest.requireMock('@/lib/it-hilfe/notifications') as { notifyReviewReceived: jest.Mock }
    notif.notifyReviewReceived.mockImplementation(() => undefined)
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await POST(makeRequest(VALID_UUID, { rating: 5 }), routeParams(VALID_UUID))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid UUID', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)

    const res = await POST(makeRequest('bad-id', { rating: 5 }), routeParams('bad-id'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid rating (out of range)', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)

    const res = await POST(makeRequest(VALID_UUID, { rating: 6 }), routeParams(VALID_UUID))
    expect(res.status).toBe(400)
  })

  it('returns 400 for rating below 1', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)

    const res = await POST(makeRequest(VALID_UUID, { rating: 0 }), routeParams(VALID_UUID))
    expect(res.status).toBe(400)
  })

  it('returns 400 when review text is too short', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)

    const res = await POST(makeRequest(VALID_UUID, { rating: 4, reviewText: 'short' }), routeParams(VALID_UUID))
    expect(res.status).toBe(400)
  })

  it('returns 404 when request not found', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupSelectChains(null, null)

    const res = await POST(makeRequest(VALID_UUID, { rating: 5 }), routeParams(VALID_UUID))
    expect(res.status).toBe(404)
  })

  it('returns 403 when user is not the requester', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupSelectChains({ ...MOCK_REQUEST_ROW, requesterId: 'other-user' }, null)

    const res = await POST(makeRequest(VALID_UUID, { rating: 5 }), routeParams(VALID_UUID))
    expect(res.status).toBe(403)
  })

  it('returns 400 when request is not completed', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupSelectChains({ ...MOCK_REQUEST_ROW, status: 'matched' }, null)

    const res = await POST(makeRequest(VALID_UUID, { rating: 5 }), routeParams(VALID_UUID))
    expect(res.status).toBe(400)
  })

  it('returns 200 when review is submitted successfully', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupSelectChains(MOCK_REQUEST_ROW, MOCK_OFFER_ROW)

    const res = await POST(makeRequest(VALID_UUID, { rating: 5, reviewText: 'Great help, very professional!' }), routeParams(VALID_UUID))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.reviewId).toBe('review-1')
  })

  it('returns 400 when FOR UPDATE re-check sees request already reviewed (double-submit guard)', async () => {
    // Race: requester double-clicks "Submit review". Both pass the outer
    // reviewedAt + findDuplicateReview checks. Inside the transaction the
    // FOR UPDATE on the request row sees reviewed_at IS NOT NULL (sibling
    // click already committed) — abort. createReview must NOT be called,
    // and reviewed_at must NOT be re-stamped.
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupSelectChains(MOCK_REQUEST_ROW, MOCK_OFFER_ROW)

    const txUpdate = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
    })
    const txExecute = jest.fn().mockResolvedValue({
      rows: [{ reviewed_at: '2026-05-25T00:00:00Z' }],  // already reviewed
    })
    mockTransaction.mockImplementationOnce(async (fn: (tx: unknown) => unknown) =>
      fn({ update: txUpdate, execute: txExecute })
    )

    const res = await POST(makeRequest(VALID_UUID, { rating: 5 }), routeParams(VALID_UUID))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/bereits bewertet/i)
    // Critical assertions: the race-loser must not write
    expect(txUpdate).not.toHaveBeenCalled()
    const reviews = jest.requireMock('@/lib/reviews/create-review') as { createReview: jest.Mock }
    expect(reviews.createReview).not.toHaveBeenCalled()
  })
})
