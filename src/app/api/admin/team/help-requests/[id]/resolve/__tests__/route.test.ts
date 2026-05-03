/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/team/help-requests/[id]/resolve
 *
 * Behaviors locked:
 *   POST /api/admin/team/help-requests/[id]/resolve
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 404 when request not found
 *   - returns 400 when already resolved
 *   - returns 400 when already cancelled
 *   - returns 200 on success
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

const mockGetDbUserId = jest.fn()

jest.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId.apply(null, args),
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockValidateResolveHelpRequest = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  helpRequests: {
    id: 'hr_id', requesterId: 'hr_requesterId', status: 'hr_status',
    resolvedBy: 'hr_resolvedBy', resolvedAt: 'hr_resolvedAt',
    resolutionNotes: 'hr_resolutionNotes', updatedAt: 'hr_updatedAt',
  },
  users: { id: 'u_id', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/help-request-status', () => ({
  HELP_REQUEST_STATUS: { RESOLVED: 'resolved', CANCELLED: 'cancelled' },
}))

jest.mock('@/lib/schemas/activity', () => ({
  validateResolveHelpRequest: (...args: unknown[]) => mockValidateResolveHelpRequest.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
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
import { POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_EXISTING = { id: 'hr-1', status: 'open', requesterEmail: 'requester@example.com' }

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/admin/team/help-requests/hr-1/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'hr-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockValidateResolveHelpRequest.mockReturnValue({ success: true, data: { resolution_notes: 'Fixed it' } })

  // getDbUserId default: user found
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'u-1' })

  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
  mockInnerJoin.mockReturnValue({ where: mockWhere })
  mockWhere.mockResolvedValueOnce([MOCK_EXISTING])   // existence check

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)
})

// ============================================================================
// POST /api/admin/team/help-requests/[id]/resolve
// ============================================================================

describe('POST /api/admin/team/help-requests/[id]/resolve — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/team/help-requests/[id]/resolve — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateResolveHelpRequest.mockReturnValueOnce({
      success: false,
      error: { flatten: () => ({ fieldErrors: {} }) },
    })
    const response = await POST(makeRequest({}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when request not found', async () => {
    mockWhere.mockReset()
    mockWhere.mockResolvedValueOnce([])
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when already resolved', async () => {
    mockWhere.mockReset()
    mockWhere.mockResolvedValueOnce([{ ...MOCK_EXISTING, status: 'resolved' }])
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when already cancelled', async () => {
    mockWhere.mockReset()
    mockWhere.mockResolvedValueOnce([{ ...MOCK_EXISTING, status: 'cancelled' }])
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('POST /api/admin/team/help-requests/[id]/resolve — success', () => {
  it('returns 200 on success', async () => {
    const response = await POST(makeRequest({ resolution_notes: 'Fixed it' }), makeContext())
    expect(response.status).toBe(200)
    expect(mockUpdateWhere).toHaveBeenCalledTimes(1)
  })
})
