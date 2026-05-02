/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/membership/[id]/approve
 *
 * Behaviors locked:
 *   POST /api/admin/membership/[id]/approve
 *   - returns 401 when not authenticated
 *   - returns 404 when application not found
 *   - returns 500 when application already processed
 *   - returns 200 with userActivated false when no user account exists
 *   - returns 200 with userActivated true when user account found by userId
 *   - returns 200 with userActivated true when user account found by email
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
    USERS: 'users',
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

const MOCK_APP_WITH_USER = {
  id: 'app-1',
  user_id: 'user-1',
  applicant_email: 'applicant@example.com',
  member_type: 'regular',
  status: 'pending',
}

const MOCK_APP_NO_USER = {
  id: 'app-1',
  user_id: null,
  applicant_email: 'applicant@example.com',
  member_type: 'regular',
  status: 'pending',
}

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/membership/app-1/approve', { method: 'POST' })
}

function makeContext(id = 'app-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Default: app with existing user_id — only needs fetch + update app + update user
  mockQuery
    .mockResolvedValueOnce({ rows: [MOCK_APP_WITH_USER] })  // fetch application
    .mockResolvedValueOnce({ rows: [] })                     // update application status
    .mockResolvedValueOnce({ rows: [] })                     // update user membership
})

// ============================================================================
// POST /api/admin/membership/[id]/approve
// ============================================================================

describe('POST /api/admin/membership/[id]/approve — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/membership/[id]/approve — validation', () => {
  it('returns 404 when application not found', async () => {
    mockQuery.mockReset()
    mockQuery.mockResolvedValueOnce({ rows: [] })
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 500 when application already processed', async () => {
    mockQuery.mockReset()
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...MOCK_APP_WITH_USER, status: 'approved' }],
    })
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(500)
  })
})

describe('POST /api/admin/membership/[id]/approve — success', () => {
  it('returns 200 with userActivated true when user_id present', async () => {
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.userActivated).toBe(true)
    expect(body.data.status).toBe('approved')
  })

  it('returns 200 with userActivated false when no user account found', async () => {
    mockQuery.mockReset()
    mockQuery
      .mockResolvedValueOnce({ rows: [MOCK_APP_NO_USER] })  // fetch application
      .mockResolvedValueOnce({ rows: [] })                   // lookup by email — not found
      .mockResolvedValueOnce({ rows: [] })                   // update application status
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.userActivated).toBe(false)
  })

  it('returns 200 with userActivated true when user found by email', async () => {
    mockQuery.mockReset()
    mockQuery
      .mockResolvedValueOnce({ rows: [MOCK_APP_NO_USER] })          // fetch application
      .mockResolvedValueOnce({ rows: [{ id: 'found-user' }] })      // lookup by email
      .mockResolvedValueOnce({ rows: [] })                           // update application status
      .mockResolvedValueOnce({ rows: [] })                           // update user membership
      .mockResolvedValueOnce({ rows: [] })                           // link user_id on application
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.userActivated).toBe(true)
  })
})
