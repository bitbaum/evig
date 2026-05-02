/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/promote-user
 *
 * Behaviors locked:
 *   POST /api/admin/promote-user
 *   - returns 401 when not authenticated
 *   - returns 400 when neither userId nor email provided
 *   - returns 404 when user not found by email
 *   - returns 404 when user not found by userId
 *   - returns 200 when promoted by userId
 *   - returns 200 when promoted by email
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
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  users: { id: 'u_id', email: 'u_email', role: 'u_role', updatedAt: 'u_updatedAt' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/lib/constants', () => ({
  ROLES: { REVAMPIT_ADMIN: 'revampit_admin' },
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

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/promote-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockFrom.mockReturnValue({ where: mockWhere })
  mockWhere.mockResolvedValue([{ id: 'user-1' }])

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([{ id: 'user-1' }])
})

// ============================================================================
// POST /api/admin/promote-user
// ============================================================================

describe('POST /api/admin/promote-user — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest({ userId: 'user-1' }))
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/promote-user — validation', () => {
  it('returns 400 when neither userId nor email provided', async () => {
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })

  it('returns 404 when user not found by email', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await POST(makeRequest({ email: 'notfound@example.com' }))
    expect(response.status).toBe(404)
  })

  it('returns 404 when user not found by userId', async () => {
    mockReturning.mockResolvedValueOnce([])
    const response = await POST(makeRequest({ userId: 'nonexistent' }))
    expect(response.status).toBe(404)
  })
})

describe('POST /api/admin/promote-user — success', () => {
  it('returns 200 when promoted by userId', async () => {
    const response = await POST(makeRequest({ userId: 'user-1' }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.userId).toBe('user-1')
  })

  it('returns 200 when promoted by email', async () => {
    const response = await POST(makeRequest({ email: 'user@example.com' }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.userId).toBe('user-1')
  })
})
