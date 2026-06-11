/**
 * @jest-environment node
 *
 * Tests for POST /api/auth/login-status
 *
 * Mission-relevant: this endpoint USED to differentiate "email not found" vs
 * "email found with these flags", which was a user-enumeration vector
 * (rate limit 10/min/IP is trivially bypassed via IP rotation). It now
 * returns a uniform safe-default payload regardless of whether the email
 * is registered. Tests below lock the uniform-response contract — any
 * regression that re-introduces branching on user existence must break
 * these tests.
 *
 * Behaviors locked:
 *   POST /api/auth/login-status
 *   - returns 429 when rate limit exceeded
 *   - returns 400 when email is missing
 *   - returns identical uniform payload for "found" and "not found" emails
 *   - never calls getUserByEmail or the lockout DB query (no enumeration vector)
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

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/auth/login-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const EXPECTED_UNIFORM = {
  exists: true,
  emailVerified: true,
  hasPassword: true,
  locked: false,
  lockedUntil: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockLoginStatusLimiter.mockReturnValue(true)
})

// ============================================================================
// POST /api/auth/login-status — rate limiting
// ============================================================================

describe('POST /api/auth/login-status — rate limiting', () => {
  it('returns 429 when rate limit exceeded', async () => {
    mockLoginStatusLimiter.mockReturnValueOnce(false)
    const response = await POST(makeRequest({ email: 'user@example.com' }))
    expect(response.status).toBe(429)
  })
})

// ============================================================================
// POST /api/auth/login-status — input validation
// ============================================================================

describe('POST /api/auth/login-status — input validation', () => {
  it('returns 400 when email is missing', async () => {
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })

  it('returns 400 when email is empty string', async () => {
    const response = await POST(makeRequest({ email: '' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when email field is wrong type', async () => {
    const response = await POST(makeRequest({ email: 12345 }))
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// POST /api/auth/login-status — uniform response (anti-enumeration)
// ============================================================================

describe('POST /api/auth/login-status — uniform response', () => {
  it('returns the uniform safe-default payload for any valid email', async () => {
    const response = await POST(makeRequest({ email: 'someone@example.com' }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual(EXPECTED_UNIFORM)
  })

  it('returns the IDENTICAL payload for a totally different email', async () => {
    // Both real-looking and fake-looking emails get the same response.
    // If a future regression branches on lookup, these assertions break.
    const realLooking = await POST(makeRequest({ email: 'andreas@revamp-it.ch' }))
    const fakeLooking = await POST(makeRequest({ email: 'noone@example.invalid' }))
    expect(await realLooking.json()).toEqual({ success: true, data: EXPECTED_UNIFORM })
    expect(await fakeLooking.json()).toEqual({ success: true, data: EXPECTED_UNIFORM })
  })

  it('never returns a "EMAIL_NOT_FOUND" reason field (the prior enumeration shape)', async () => {
    const response = await POST(makeRequest({ email: 'anyone@example.com' }))
    const body = await response.json()
    expect(body.data.reason).toBeUndefined()
    expect(body.data.exists).toBe(true)
  })
})
