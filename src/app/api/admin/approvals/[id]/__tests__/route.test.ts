/**
 * @jest-environment node
 *
 * Tests for PATCH /api/admin/approvals/[id] — pilot B on the shared
 * review-workflow core.
 *
 * The lock/UPDATE/dispatch mechanics are covered by the lifecycle tests.
 * THESE tests lock the route's wiring:
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - failure-code mapping: not_found→404, invalid_transition→400 (with the
 *     approved-is-terminal message), conflict→400
 *   - 200 on approve/reject with the historic message + status payload
 *   - reject passes the reason through; approve/reopen use reason:'skip'
 *   - emit builds the full event: notification + rich-template metadata +
 *     historic activity verbs + content_decision audit with route context
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
        const resolvedContext = context?.params
          ? { params: await context.params }
          : undefined
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, resolvedContext)
      })
  },
}))

const mockRunReviewTransition = jest.fn()
jest.mock('@/lib/lifecycle/review-workflow', () => ({
  runReviewTransition: (opts: unknown) => mockRunReviewTransition(opts),
}))

const mockWhere = jest.fn()
jest.mock('@/db', () => ({
  db: {
    select: () => ({ from: () => ({ where: mockWhere }) }),
  },
}))

jest.mock('@/db/schema', () => ({
  users: { id: 'u_id', email: 'u_email', name: 'u_name' },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn().mockReturnValue({ __eq: true }),
}))

jest.mock('@/lib/schemas', () => ({
  validateBody: jest.fn(),
  AdminApprovalActionSchema: {},
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (entity: string) =>
      NextResponse.json({ success: false, error: `${entity} nicht gefunden` }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { PATCH } from '../route'

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const ROW = {
  status: 'pending',
  user_id: 'u1',
  title: 'Mein Blog-Artikel',
  content_type: 'blog_post',
  content_id: 'p-1',
}

function makeRequest(body: Record<string, unknown> = { action: 'approve' }) {
  return new NextRequest('http://localhost/api/admin/approvals/sub-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'user-agent': 'jest-agent', 'x-forwarded-for': '9.9.9.9' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'sub-1') {
  return { params: Promise.resolve({ id }) }
}

function setValidBody(data: Record<string, unknown>) {
  const schemas = jest.requireMock('@/lib/schemas') as { validateBody: jest.Mock }
  schemas.validateBody.mockReturnValue({ success: true, data })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockWhere.mockResolvedValue([{ name: 'User', email: 'user@example.com' }])
  setValidBody({ action: 'approve' })
  mockRunReviewTransition.mockResolvedValue({ ok: true, row: ROW, from: 'pending', to: 'approved' })
})

describe('PATCH /api/admin/approvals/[id] — auth + validation', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })

  it('returns 400 when body is invalid', async () => {
    const schemas = jest.requireMock('@/lib/schemas') as { validateBody: jest.Mock }
    const { NextResponse } = jest.requireActual('next/server')
    schemas.validateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await PATCH(makeRequest({}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/admin/approvals/[id] — failure-code mapping', () => {
  it('not_found → 404', async () => {
    mockRunReviewTransition.mockResolvedValueOnce({ ok: false, code: 'not_found' })
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('invalid_transition from approved → 400 with the terminal message', async () => {
    mockRunReviewTransition.mockResolvedValueOnce({
      ok: false, code: 'invalid_transition', reason: 'wrong_state', from: 'approved',
    })
    const response = await PATCH(makeRequest({ action: 'reject' }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('Genehmigte Einreichungen')
  })

  it('conflict → 400', async () => {
    mockRunReviewTransition.mockResolvedValueOnce({ ok: false, code: 'conflict' })
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/admin/approvals/[id] — success wiring', () => {
  it('returns 200 with message + status on approve', async () => {
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.status).toBe('approved')
    expect(body.data.message).toBe('Inhalt genehmigt')
  })

  it('reject passes the reason through; approve/reopen skip the reason column', async () => {
    setValidBody({ action: 'reject', reason: 'Bitte Quellen ergänzen' })
    mockRunReviewTransition.mockResolvedValueOnce({ ok: true, row: ROW, from: 'pending', to: 'rejected' })
    await PATCH(makeRequest({ action: 'reject' }), makeContext())

    const opts = mockRunReviewTransition.mock.calls[0][0]
    expect(opts.reason).toBe('Bitte Quellen ergänzen')
    expect(opts.target.columns.reason).toBe('rejection_reason')
    expect(opts.write.approve).toEqual({ reason: 'skip' })
    expect(opts.write.reopen).toEqual({ reason: 'skip' })
    expect(opts.write.reject).toBeUndefined() // default = write it
  })

  it('emit builds notification + metadata + historic activity verb + audit ctx', async () => {
    setValidBody({ action: 'reject', reason: 'Zu kurz' })
    await PATCH(makeRequest({ action: 'reject' }), makeContext())

    const opts = mockRunReviewTransition.mock.calls[0][0]
    const event = await opts.emit(ROW, { from: 'pending', to: 'rejected', action: 'reject' })

    expect(event).toEqual(expect.objectContaining({
      type: 'content_submission_status',
      recipients: { userId: 'u1' },
      title: 'Einreichung abgelehnt',
    }))
    expect(event.content).toContain('Zu kurz')
    expect(event.metadata).toEqual(expect.objectContaining({
      action: 'reject', submitterName: 'User', title: ROW.title, contentType: 'blog_post', reason: 'Zu kurz',
    }))
    expect(event.activity).toEqual(expect.objectContaining({
      actorId: 'admin-1', action: 'rejected_listing', subjectId: 'p-1',
    }))
    expect(event.audit).toEqual(expect.objectContaining({
      kind: 'content_decision',
      decision: 'rejected',
      ctx: expect.objectContaining({ ipAddress: '9.9.9.9', userAgent: 'jest-agent', userId: 'admin-1' }),
    }))
  })

  it('emit returns null for reopen (no notification on re-queue)', async () => {
    setValidBody({ action: 'reopen' })
    mockRunReviewTransition.mockResolvedValueOnce({ ok: true, row: ROW, from: 'rejected', to: 'pending' })
    await PATCH(makeRequest({ action: 'reopen' }), makeContext())

    const opts = mockRunReviewTransition.mock.calls[0][0]
    const event = await opts.emit(ROW, { from: 'rejected', to: 'pending', action: 'reopen' })
    expect(event).toBeNull()
  })

  it('returns 500 when the core throws', async () => {
    mockRunReviewTransition.mockRejectedValueOnce(new Error('DB error'))
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(500)
  })
})
