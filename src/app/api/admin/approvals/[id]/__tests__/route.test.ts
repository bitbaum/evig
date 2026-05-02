/**
 * @jest-environment node
 *
 * Tests for PATCH /api/admin/approvals/[id]
 *
 * Mission-relevant: content approval transitions are governance actions —
 * wrong status transitions would allow approving already-approved content
 * or rejecting content that can't be rejected.
 *
 * Behaviors locked:
 *   PATCH /api/admin/approvals/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 404 when submission not found
 *   - returns 400 when transition is invalid (e.g. approved → rejected)
 *   - returns 200 on approve
 *   - returns 200 on reject
 *   - email failure does not affect response (fire-and-forget)
 *   - returns 500 when DB throws
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
const mockInnerJoin = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  userContentSubmissions: { id: 'ucs_id', status: 'ucs_status', title: 'ucs_title', contentType: 'ucs_contentType', contentId: 'ucs_contentId', userId: 'ucs_userId', reviewedBy: 'ucs_reviewedBy', reviewedAt: 'ucs_reviewedAt', updatedAt: 'ucs_updatedAt' },
  users: { id: 'u_id', email: 'u_email', name: 'u_name' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'NOW()' }), { raw: jest.fn(), join: jest.fn() }),
}))

jest.mock('@/lib/schemas', () => ({
  validateBody: jest.fn().mockReturnValue({ success: true, data: { action: 'approve' } }),
  AdminApprovalActionSchema: {},
}))

jest.mock('@/config/approval-status', () => ({
  APPROVAL_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    REQUIRES_CHANGES: 'requires_changes',
    PUBLISHED: 'published',
  },
}))

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/activity', () => ({
  logActivity: jest.fn(),
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

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { PATCH } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_SUBMISSION_PENDING = {
  id: 'sub-1',
  status: 'pending',
  title: 'Mein Blog-Artikel',
  contentType: 'blog_post',
  contentId: 'p-1',
}

const MOCK_SUBMISSION_APPROVED = {
  ...MOCK_SUBMISSION_PENDING,
  status: 'approved',
}

const MOCK_SUBMITTER = {
  email: 'user@example.com',
  name: 'User',
}

function makeRequest(body: Record<string, unknown> = { action: 'approve' }) {
  return new NextRequest('http://localhost/api/admin/approvals/sub-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'sub-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  // GET submission: from().where()
  // GET submitter: from().innerJoin().where()
  mockFrom.mockReturnValue({ where: mockWhere, innerJoin: mockInnerJoin })
  mockInnerJoin.mockReturnValue({ where: mockWhere })
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)
  // By default: submission exists (pending) + submitter found
  mockWhere
    .mockResolvedValueOnce([MOCK_SUBMISSION_PENDING])  // submission lookup
    .mockResolvedValueOnce([MOCK_SUBMITTER])             // submitter lookup

  const schemas = require('@/lib/schemas')
  schemas.validateBody.mockReturnValue({ success: true, data: { action: 'approve' } })
})

// ============================================================================
// PATCH /api/admin/approvals/[id]
// ============================================================================

describe('PATCH /api/admin/approvals/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/admin/approvals/[id] — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const schemas = require('@/lib/schemas')
    const { NextResponse } = jest.requireActual('next/server')
    schemas.validateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await PATCH(makeRequest({}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/admin/approvals/[id] — service errors', () => {
  it('returns 404 when submission not found', async () => {
    mockWhere.mockReset()
    mockWhere.mockResolvedValueOnce([])
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when transition is invalid', async () => {
    mockWhere.mockReset()
    mockWhere.mockResolvedValueOnce([MOCK_SUBMISSION_APPROVED])
    const response = await PATCH(makeRequest({ action: 'reject' }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/admin/approvals/[id] — success', () => {
  it('returns 200 on approve', async () => {
    const response = await PATCH(makeRequest({ action: 'approve' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.status).toBe('approved')
  })

  it('returns 200 on reject', async () => {
    const schemas = require('@/lib/schemas')
    schemas.validateBody.mockReturnValueOnce({ success: true, data: { action: 'reject' } })
    const response = await PATCH(makeRequest({ action: 'reject' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.status).toBe('rejected')
  })

  it('email failure does not affect response', async () => {
    const { sendEmail } = require('@/lib/email')
    sendEmail.mockRejectedValueOnce(new Error('SMTP error'))
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(200)
  })

  it('returns 500 when DB update throws', async () => {
    mockUpdateWhere.mockRejectedValueOnce(new Error('DB error'))
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(500)
  })
})
