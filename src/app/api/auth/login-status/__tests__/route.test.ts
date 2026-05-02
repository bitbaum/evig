/**
 * @jest-environment node
 *
 * Tests for POST /api/auth/login-status
 *
 * Mission-relevant: the login form uses this to detect whether an email is
 * registered, verified, and locked before prompting for a password. Wrong
 * responses cause confusing UX at the signin gate.
 *
 * Behaviors locked:
 *   POST /api/auth/login-status
 *   - returns 429 when rate limit exceeded
 *   - returns 400 when email is missing
 *   - returns exists: false when user not found
 *   - returns 503 when DB connection fails
 *   - returns exists: true with user flags when found
 *   - returns locked: true when lockout is active
 *   - returns locked: false when no lockout row exists
 *   - returns 500 on unexpected error
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockLoginStatusLimiter = jest.fn().mockReturnValue(true) // not limited by default

jest.mock('@/lib/security/rate-limit', () => ({
  createRateLimiter: jest.fn().mockReturnValue(
    (...args: unknown[]) => mockLoginStatusLimiter(...args)
  ),
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
}))

const mockGetUserByEmail = jest.fn()

jest.mock('@/lib/auth/db', () => ({
  getUserByEmail: (...args: unknown[]) => mockGetUserByEmail.apply(null, args),
}))

// Lockout check chain: select().from().where()
const mockLockoutWhere = jest.fn()
const mockLockoutFrom = jest.fn().mockReturnValue({ where: mockLockoutWhere })
const mockLockoutSelect = jest.fn().mockReturnValue({ from: mockLockoutFrom })

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockLockoutSelect.apply(null, args),
  },
}))

jest.mock('@/db/schema/auth', () => ({
  userLockouts: { userId: 'ul_userId', lockedUntil: 'ul_lockedUntil' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    EMAIL_REQUIRED: 'E-Mail-Adresse ist erforderlich',
    STATUS_CHECK_FAILED: 'Statusprüfung fehlgeschlagen',
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiRateLimited: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 429 }),
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

const MOCK_USER = {
  id: 'user-1', email: 'user@example.com', emailVerified: new Date(),
  password_hash: 'hashed', name: 'Test User',
}

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/auth/login-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const FAR_FUTURE = new Date(Date.now() + 1000 * 60 * 60).toISOString()
const PAST = new Date(Date.now() - 1000).toISOString()

beforeEach(() => {
  jest.resetAllMocks()
  mockLoginStatusLimiter.mockReturnValue(true)
  mockGetUserByEmail.mockResolvedValue(MOCK_USER)
  mockLockoutSelect.mockReturnValue({ from: mockLockoutFrom })
  mockLockoutFrom.mockReturnValue({ where: mockLockoutWhere })
  mockLockoutWhere.mockResolvedValue([]) // no lockout by default
})

// ============================================================================
// POST /api/auth/login-status
// ============================================================================

describe('POST /api/auth/login-status — rate limiting', () => {
  it('returns 429 when rate limit exceeded', async () => {
    mockLoginStatusLimiter.mockReturnValueOnce(false)
    const response = await POST(makeRequest({ email: 'user@example.com' }))
    expect(response.status).toBe(429)
  })
})

describe('POST /api/auth/login-status — input validation', () => {
  it('returns 400 when email is missing', async () => {
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/auth/login-status — user lookup', () => {
  it('returns exists: false when user not found', async () => {
    mockGetUserByEmail.mockResolvedValueOnce(null)
    const response = await POST(makeRequest({ email: 'noone@example.com' }))
    const body = await response.json()
    expect(body.data.exists).toBe(false)
    expect(body.data.reason).toBe('EMAIL_NOT_FOUND')
  })

  it('returns exists: true with user flags when user found', async () => {
    const response = await POST(makeRequest({ email: 'user@example.com' }))
    const body = await response.json()
    expect(body.data.exists).toBe(true)
    expect(body.data.emailVerified).toBe(true)
    expect(body.data.hasPassword).toBe(true)
  })

  it('returns locked: false when no active lockout', async () => {
    const response = await POST(makeRequest({ email: 'user@example.com' }))
    const body = await response.json()
    expect(body.data.locked).toBe(false)
  })

  it('returns locked: true when lockout is active', async () => {
    mockLockoutWhere.mockResolvedValueOnce([{ lockedUntil: FAR_FUTURE }])
    const response = await POST(makeRequest({ email: 'user@example.com' }))
    const body = await response.json()
    expect(body.data.locked).toBe(true)
    expect(body.data.lockedUntil).toBeTruthy()
  })

  it('returns locked: false when lockout is expired', async () => {
    mockLockoutWhere.mockResolvedValueOnce([{ lockedUntil: PAST }])
    const response = await POST(makeRequest({ email: 'user@example.com' }))
    const body = await response.json()
    expect(body.data.locked).toBe(false)
  })

  it('returns 503 when DB connection fails', async () => {
    mockGetUserByEmail.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const response = await POST(makeRequest({ email: 'user@example.com' }))
    expect(response.status).toBe(503)
  })
})

describe('POST /api/auth/login-status — error handling', () => {
  it('returns 500 on unexpected error', async () => {
    mockGetUserByEmail.mockRejectedValueOnce(new Error('unexpected database error'))
    const response = await POST(makeRequest({ email: 'user@example.com' }))
    expect(response.status).toBe(500)
  })
})
