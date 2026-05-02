/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/membership/[id]/reject
 *
 * Behaviors locked:
 *   POST /api/admin/membership/[id]/reject
 *   - returns 401 when not authenticated
 *   - returns 404 when application not found
 *   - returns 500 when application already processed
 *   - returns 200 on successful rejection
 *   - returns 200 on rejection with admin_notes
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

const mockQuery = jest.fn()

jest.mock('@/lib/auth/db', () => ({
  query: (...args: unknown[]) => mockQuery.apply(null, args),
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: {
    MEMBERSHIP_APPLICATIONS: 'membership_applications',
  },
}))

jest.mock('@/config/membership-status', () => ({
  MEMBERSHIP_APPLICATION_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
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
import { POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_APP = {
  id: 'app-1',
  applicant_email: 'applicant@example.com',
  status: 'pending',
}

function makeRequest(body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/membership/app-1/reject', {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(id = 'app-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockQuery
    .mockResolvedValueOnce({ rows: [MOCK_APP] })  // fetch application
    .mockResolvedValueOnce({ rows: [] })           // update status
})

// ============================================================================
// POST /api/admin/membership/[id]/reject
// ============================================================================

describe('POST /api/admin/membership/[id]/reject — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/membership/[id]/reject — validation', () => {
  it('returns 404 when application not found', async () => {
    mockQuery.mockReset()
    mockQuery.mockResolvedValueOnce({ rows: [] })
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 500 when application already processed', async () => {
    mockQuery.mockReset()
    mockQuery.mockResolvedValueOnce({ rows: [{ ...MOCK_APP, status: 'approved' }] })
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(500)
  })
})

describe('POST /api/admin/membership/[id]/reject — success', () => {
  it('returns 200 on successful rejection', async () => {
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.status).toBe('rejected')
    expect(body.data.id).toBe('app-1')
  })

  it('returns 200 on rejection with admin_notes', async () => {
    const response = await POST(makeRequest({ admin_notes: 'Incomplete documents' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.status).toBe('rejected')
  })
})
