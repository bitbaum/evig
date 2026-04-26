/**
 * Tests for the withAuth + withAdmin middleware in lib/api/middleware.ts
 *
 * These middlewares gate every authenticated and admin-only API route in
 * the codebase. A regression here either lets unauthenticated users into
 * sensitive endpoints, or blocks legitimate users — both are silent
 * security/availability failures.
 *
 * Tests verify the auth gate (no session → 401), the staff gate (auth'd
 * non-staff → 403), the section gate (staff without `products` permission
 * → 403 on `withAdmin('products', ...)`), and the happy path (handler is
 * invoked with a typed `ValidSession`). Async-params support (Next.js 15)
 * is also exercised.
 */

// `next/server` types pulled in by middleware.ts; mock to avoid the
// browser/edge Request global. Marker objects let us assert which
// failure path was hit.
jest.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: { json: jest.fn().mockReturnValue('mocked-response') },
}))

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}))

// Mock the auth() function — each test sets its return value via mockResolvedValue.
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Marker strings let tests assert which gate fired without coupling to
// NextResponse internals. Defined inline because jest.mock factories
// can't reference outer variables (hoisting).
jest.mock('../helpers', () => ({
  apiUnauthorized: jest.fn().mockReturnValue('marker:unauthorized'),
  apiForbidden: jest.fn().mockReturnValue('marker:forbidden'),
}))

import { auth } from '@/auth'
import { withAuth, withAdmin } from '../middleware'

const UNAUTHORIZED_MARKER = 'marker:unauthorized'
const FORBIDDEN_MARKER = 'marker:forbidden'
const mockAuth = auth as jest.Mock

beforeEach(() => {
  mockAuth.mockReset()
})

const validSession = {
  user: {
    id: 'user-1',
    email: 'user@revamp-it.ch',
    name: 'Test User',
    isStaff: true,
    staffPermissions: ['products'],
    isSuperAdmin: false,
  },
  expires: '2099-01-01T00:00:00Z',
}

const nonStaffSession = {
  user: {
    id: 'user-2',
    email: 'guest@example.com',
    name: 'Guest',
    isStaff: false,
    staffPermissions: [],
    isSuperAdmin: false,
  },
  expires: '2099-01-01T00:00:00Z',
}

// Stub request — middleware never reads its body. Using `as never` lets
// TS satisfy the NextRequest position without depending on the real type.
const REQ = {} as never

// ============================================================================
// withAuth
// ============================================================================

describe('withAuth', () => {
  it('returns 401 marker when no session is present', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const handler = jest.fn()

    const wrapped = withAuth(handler)
    const result = await wrapped(REQ)

    expect(result).toBe(UNAUTHORIZED_MARKER)
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 401 when session exists but has no user.id', async () => {
    mockAuth.mockResolvedValueOnce({ user: { email: 'x@y.ch' }, expires: 'never' })
    const handler = jest.fn()

    const wrapped = withAuth(handler)
    const result = await wrapped(REQ)

    expect(result).toBe(UNAUTHORIZED_MARKER)
    expect(handler).not.toHaveBeenCalled()
  })

  it('calls the handler with the session when authenticated', async () => {
    mockAuth.mockResolvedValueOnce(validSession)
    const handler = jest.fn().mockResolvedValue('handler-result')

    const wrapped = withAuth(handler)
    const result = await wrapped(REQ)

    expect(handler).toHaveBeenCalledWith(REQ, validSession, undefined)
    expect(result).toBe('handler-result')
  })

  it('awaits async params and forwards them to the handler', async () => {
    mockAuth.mockResolvedValueOnce(validSession)
    const handler = jest.fn().mockResolvedValue('ok')

    const wrapped = withAuth<{ id: string }>(handler)
    await wrapped(REQ, { params: Promise.resolve({ id: 'abc' }) })

    expect(handler).toHaveBeenCalledWith(REQ, validSession, { params: { id: 'abc' } })
  })
})

// ============================================================================
// withAdmin (no section)
// ============================================================================

describe('withAdmin (any staff)', () => {
  it('returns 401 when no session', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const handler = jest.fn()

    const result = await withAdmin(handler)(REQ)

    expect(result).toBe(UNAUTHORIZED_MARKER)
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 403 when session is authenticated but not staff', async () => {
    mockAuth.mockResolvedValueOnce(nonStaffSession)
    const handler = jest.fn()

    const result = await withAdmin(handler)(REQ)

    expect(result).toBe(FORBIDDEN_MARKER)
    expect(handler).not.toHaveBeenCalled()
  })

  it('calls the handler when the user is staff', async () => {
    mockAuth.mockResolvedValueOnce(validSession)
    const handler = jest.fn().mockResolvedValue('ok')

    const result = await withAdmin(handler)(REQ)

    expect(handler).toHaveBeenCalledWith(REQ, validSession, undefined)
    expect(result).toBe('ok')
  })

  it('awaits async params and forwards them when staff', async () => {
    mockAuth.mockResolvedValueOnce(validSession)
    const handler = jest.fn().mockResolvedValue('ok')

    await withAdmin<{ id: string }>(handler)(REQ, { params: Promise.resolve({ id: 'abc' }) })

    expect(handler).toHaveBeenCalledWith(REQ, validSession, { params: { id: 'abc' } })
  })
})

// ============================================================================
// withAdmin (section-gated)
// ============================================================================

describe('withAdmin (section-gated)', () => {
  it('returns 401 when no session', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const handler = jest.fn()

    const result = await withAdmin('products', handler)(REQ)

    expect(result).toBe(UNAUTHORIZED_MARKER)
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 403 when not staff', async () => {
    mockAuth.mockResolvedValueOnce(nonStaffSession)
    const handler = jest.fn()

    const result = await withAdmin('products', handler)(REQ)

    expect(result).toBe(FORBIDDEN_MARKER)
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 403 when staff but lacks the section permission', async () => {
    const staffMissingPerm = {
      ...validSession,
      user: { ...validSession.user, staffPermissions: ['users'] }, // not 'products'
    }
    mockAuth.mockResolvedValueOnce(staffMissingPerm)
    const handler = jest.fn()

    const result = await withAdmin('products', handler)(REQ)

    expect(result).toBe(FORBIDDEN_MARKER)
    expect(handler).not.toHaveBeenCalled()
  })

  it('calls the handler when staff has the matching section permission', async () => {
    mockAuth.mockResolvedValueOnce(validSession) // has ['products']
    const handler = jest.fn().mockResolvedValue('ok')

    const result = await withAdmin('products', handler)(REQ)

    expect(handler).toHaveBeenCalledWith(REQ, validSession, undefined)
    expect(result).toBe('ok')
  })

  it('calls the handler when staff has wildcard (*) permission', async () => {
    const staffWildcard = {
      ...validSession,
      user: { ...validSession.user, staffPermissions: ['*'] },
    }
    mockAuth.mockResolvedValueOnce(staffWildcard)
    const handler = jest.fn().mockResolvedValue('ok')

    const result = await withAdmin('finanzen', handler)(REQ)

    expect(handler).toHaveBeenCalled()
    expect(result).toBe('ok')
  })

  it('calls the handler when user is super admin (regardless of section)', async () => {
    const superAdmin = {
      ...validSession,
      user: { ...validSession.user, isSuperAdmin: true, staffPermissions: [] },
    }
    mockAuth.mockResolvedValueOnce(superAdmin)
    const handler = jest.fn().mockResolvedValue('ok')

    const result = await withAdmin('finanzen', handler)(REQ)

    expect(handler).toHaveBeenCalled()
    expect(result).toBe('ok')
  })
})
