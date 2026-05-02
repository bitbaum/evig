/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/auth
 *
 * Mission-relevant: legacy CMS compatibility check — returns the session's
 * auth state and whether the user is staff. Clients rely on the `role`
 * field to decide whether to show admin UI.
 *
 * Behaviors locked:
 *   GET /api/admin/auth
 *   - returns 401 when not authenticated
 *   - returns 200 with authenticated: true when session exists
 *   - returns role: 'admin' for staff users
 *   - returns role: 'user' for non-staff users
 *   - returns the user's email in the response
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiUnauthorized: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 401 }),
  }
})

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { GET } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSession(isStaff: boolean) {
  return {
    user: { id: 'user-1', email: 'test@revamp-it.ch', name: 'Test', isStaff, staffPermissions: [] as string[], isSuperAdmin: false },
    expires: '2027-01-01',
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(makeSession(true))
})

// ============================================================================
// GET /api/admin/auth
// ============================================================================

describe('GET /api/admin/auth — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValueOnce({ user: {}, expires: '2027-01-01' })
    const response = await GET()
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/auth — authenticated', () => {
  it('returns 200 for staff user', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
  })

  it('returns authenticated: true', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.data.authenticated).toBe(true)
  })

  it('returns role: admin for staff user', async () => {
    mockAuth.mockResolvedValueOnce(makeSession(true))
    const response = await GET()
    const body = await response.json()
    expect(body.data.user.role).toBe('admin')
  })

  it('returns role: user for non-staff user', async () => {
    mockAuth.mockResolvedValueOnce(makeSession(false))
    const response = await GET()
    const body = await response.json()
    expect(body.data.user.role).toBe('user')
  })

  it('returns the user email', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.data.user.email).toBe('test@revamp-it.ch')
  })
})
