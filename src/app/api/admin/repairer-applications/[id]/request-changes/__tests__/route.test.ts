/**
 * @jest-environment node
 *
 * Tests for PUT /api/admin/repairer-applications/[id]/request-changes
 *
 * Behaviors locked:
 *   PUT /api/admin/repairer-applications/[id]/request-changes
 *   - returns 401 when not authenticated
 *   - returns 400 when requestedChanges is missing
 *   - returns 404 when application not found
 *   - returns 400 when application already approved
 *   - returns 400 when application already rejected
 *   - returns 200 on success (updates status + sends email)
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

const mockDbExecute = jest.fn()
const mockSendEmail = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  repairerApplications: {},
  users: {},
}))

jest.mock('drizzle-orm', () => ({
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  getTableName: (_table: unknown) => 'mock_table',
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
  SUCCESS_MESSAGES: {},
}))

jest.mock('@/config/approval-status', () => ({
  APPROVAL_STATUS: { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected', REQUIRES_CHANGES: 'requires_changes' },
}))

jest.mock('@/config/urls', () => ({
  APP_URL: 'https://revamp-it.ch',
}))

jest.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail.apply(null, args),
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

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { PUT } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_APP = {
  user_id: 'u-1', email: 'applicant@example.com', name: 'Hans', status: 'pending',
}

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/admin/repairer-applications/app-1/request-changes', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'app-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockDbExecute.mockResolvedValue({ rows: [MOCK_APP] })
  mockSendEmail.mockResolvedValue({ success: true })
})

// ============================================================================
// PUT /api/admin/repairer-applications/[id]/request-changes
// ============================================================================

describe('PUT /api/admin/repairer-applications/[id]/request-changes — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PUT(makeRequest({ requestedChanges: 'Add insurance info' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PUT /api/admin/repairer-applications/[id]/request-changes — validation', () => {
  it('returns 400 when requestedChanges is missing', async () => {
    const response = await PUT(makeRequest({}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when application not found', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })
    const response = await PUT(makeRequest({ requestedChanges: 'Add insurance info' }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when application already approved', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [{ ...MOCK_APP, status: 'approved' }] })
    const response = await PUT(makeRequest({ requestedChanges: 'Add insurance info' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when application already rejected', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [{ ...MOCK_APP, status: 'rejected' }] })
    const response = await PUT(makeRequest({ requestedChanges: 'Add insurance info' }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PUT /api/admin/repairer-applications/[id]/request-changes — success', () => {
  it('returns 200 on success', async () => {
    const response = await PUT(makeRequest({ requestedChanges: 'Add insurance info' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.applicationId).toBe('app-1')
    expect(mockDbExecute).toHaveBeenCalledTimes(2)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })
})
