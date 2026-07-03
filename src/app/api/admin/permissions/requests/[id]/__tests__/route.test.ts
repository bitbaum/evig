/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/permissions/requests/[id]
 *
 * Behaviors locked:
 *   POST /api/admin/permissions/requests/[id]
 *   - returns 401 when not authenticated
 *   - returns 403 when not a super admin
 *   - returns 400 when action is invalid
 *   - returns 404 when request not found
 *   - returns 400 when request already processed
 *   - returns 200 on reject
 *   - returns 200 on approve (permission merge happens inside the workflow tx)
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockIsSuperAdmin = jest.fn()
const mockRunReviewTransition = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/lib/lifecycle/review-workflow', () => ({
  runReviewTransition: (opts: unknown) => mockRunReviewTransition(opts),
}))

jest.mock('@/db/schema', () => ({
  staffPermissionRequests: {
    id: 'spr_id', userId: 'spr_userId', requestedSections: 'spr_sections',
    status: 'spr_status', reviewedBy: 'spr_reviewedBy', reviewedAt: 'spr_reviewedAt',
    reviewNotes: 'spr_reviewNotes',
  },
  users: { id: 'u_id', staffPermissions: 'u_staffPerms', isStaff: 'u_isStaff' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/lib/permissions', () => ({
  isSuperAdmin: (...args: unknown[]) => mockIsSuperAdmin.apply(null, args),
}))

jest.mock('@/config/permission-request-status', () => ({
  PERMISSION_REQUEST_STATUS: { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_PERM_REQUEST = { id: 'req-1', userId: 'user-1', requestedSections: ['products'], status: 'pending' }

function makeRequest(body: Record<string, unknown> = { action: 'reject' }) {
  return new NextRequest('http://localhost/api/admin/permissions/requests/req-1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'req-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockIsSuperAdmin.mockReturnValue(true)
  mockRunReviewTransition.mockResolvedValue({
    ok: true,
    row: MOCK_PERM_REQUEST,
    from: 'pending',
    to: 'rejected',
  })

  mockFrom.mockReturnValue({ where: mockWhere })
  // Default: reject path needs only permRequest select + update
  mockWhere
    .mockResolvedValueOnce([MOCK_PERM_REQUEST])          // permRequest fetch
    .mockResolvedValueOnce([{ staffPermissions: [] }])   // user fetch (approve path)

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)
})

// ============================================================================
// POST /api/admin/permissions/requests/[id]
// ============================================================================

describe('POST /api/admin/permissions/requests/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/permissions/requests/[id] — authorization', () => {
  it('returns 403 when not a super admin', async () => {
    mockIsSuperAdmin.mockReturnValueOnce(false)
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(403)
  })
})

describe('POST /api/admin/permissions/requests/[id] — validation', () => {
  it('returns 400 when action is invalid', async () => {
    const response = await POST(makeRequest({ action: 'invalid' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when request not found', async () => {
    mockRunReviewTransition.mockResolvedValueOnce({ ok: false, code: 'not_found' })
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when request already processed', async () => {
    mockRunReviewTransition.mockResolvedValueOnce({
      ok: false,
      code: 'invalid_transition',
      reason: 'wrong_state',
      from: 'approved',
    })
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('POST /api/admin/permissions/requests/[id] — success', () => {
  it('returns 200 on reject', async () => {
    const response = await POST(makeRequest({ action: 'reject' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.message).toContain('abgelehnt')
  })

  it('returns 200 on approve and updates user permissions', async () => {
    mockRunReviewTransition.mockResolvedValueOnce({
      ok: true,
      row: MOCK_PERM_REQUEST,
      from: 'pending',
      to: 'approved',
    })
    const response = await POST(makeRequest({ action: 'approve' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.message).toContain('genehmigt')
    const opts = mockRunReviewTransition.mock.calls[0][0]
    expect(opts.action).toBe('approve')
    expect(opts.guards.map((guard: { code: string }) => guard.code)).toEqual(['super_admin_only'])
    const tx = { execute: jest.fn().mockResolvedValue(undefined) }
    await opts.applyInTxn(tx, { user_id: 'user-1', requested_sections: ['products'] }, { action: 'approve' })
    expect(tx.execute).toHaveBeenCalledTimes(1)
  })

  it('emits a requester notification after review', async () => {
    await POST(makeRequest({ action: 'reject', notes: 'Nicht jetzt' }), makeContext())
    const opts = mockRunReviewTransition.mock.calls[0][0]
    const event = opts.emit(
      { user_id: 'user-1', requested_sections: ['products', 'users'] },
      { action: 'reject' },
    )
    expect(event).toEqual(expect.objectContaining({
      type: 'permission_request_reviewed',
      recipients: { userId: 'user-1' },
      title: 'Berechtigungsanfrage abgelehnt',
    }))
    expect(event.content).toContain('Nicht jetzt')
  })
})
