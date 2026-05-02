/**
 * @jest-environment node
 *
 * Tests for POST /api/auth/register
 *
 * Mission-relevant: registration is the entry point for all volunteers,
 * donors, and workshop participants. If validation is bypassed or the wrong
 * status is returned, the onboarding funnel breaks.
 *
 * Behaviors locked:
 *   POST /api/auth/register
 *   - returns 429 when rate limited
 *   - returns 400 on schema validation failure
 *   - returns 200 on successful registration
 *   - returns 400 when registerUser reports a failure
 *   - returns 503 on DB connection error
 *   - returns 500 on unexpected error
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCheckRateLimit = jest.fn()
const mockGetClientIp = jest.fn().mockReturnValue('10.0.0.1')

jest.mock('@/lib/auth/rate-limiter', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit.apply(null, args),
  getClientIp: (...args: unknown[]) => mockGetClientIp.apply(null, args),
}))

const mockRegisterUser = jest.fn()

jest.mock('@/auth', () => ({
  registerUser: (...args: unknown[]) => mockRegisterUser.apply(null, args),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => ({
  apiSuccess: (data: unknown, status = 200) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: true, data }, { status })
  },
  apiBadRequest: (msg: string) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status: 400 })
  },
  apiError: (err: unknown, msg: string, status = 500) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status })
  },
  apiRateLimited: (msg: string) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status: 429 })
  },
}))

// The route uses RegisterSchema.safeParse() directly (not validateBody).
// Mock the schema module to control output without depending on password complexity rules.
jest.mock('@/lib/schemas', () => {
  const actual = jest.requireActual('@/lib/schemas')
  return {
    ...actual,
    RegisterSchema: {
      safeParse: jest.fn((body: unknown) => {
        const b = body as Record<string, unknown>
        if (!b?.email || !String(b.email).includes('@') || !b?.password || String(b.password).length < 8) {
          return { success: false, error: { flatten: () => ({ fieldErrors: { email: ['Invalid'] } }) } }
        }
        return { success: true, data: { email: b.email, password: b.password, name: b.name, role: b.role || 'customer' } }
      }),
    },
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

const VALID_BODY = {
  email: 'newuser@example.com',
  password: 'ValidPass1',
  name: 'New User',
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfter: 0, remaining: 4, resetAt: 0 })
  mockRegisterUser.mockResolvedValue({ success: true, data: { id: 'user-1', email: 'newuser@example.com' } })
})

// ============================================================================
// POST /api/auth/register
// ============================================================================

describe('POST /api/auth/register — rate limiting', () => {
  it('returns 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 3600, remaining: 0, resetAt: 0 })
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(429)
  })

  it('does not call registerUser when rate limited', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 3600, remaining: 0, resetAt: 0 })
    await POST(makeRequest(VALID_BODY))
    expect(mockRegisterUser).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/register — validation', () => {
  it('returns 400 when email is invalid', async () => {
    const response = await POST(makeRequest({ email: 'bad', password: 'ValidPass1' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when password is too short', async () => {
    const response = await POST(makeRequest({ email: 'test@example.com', password: 'short' }))
    expect(response.status).toBe(400)
  })

  it('does not call registerUser on validation failure', async () => {
    await POST(makeRequest({ email: 'bad', password: 'x' }))
    expect(mockRegisterUser).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/register — success', () => {
  it('returns 200 on valid registration', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(200)
  })

  it('returns success: true', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('calls registerUser with email, password, name, role', async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mockRegisterUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'newuser@example.com', name: 'New User' }),
    )
  })
})

describe('POST /api/auth/register — registerUser failures', () => {
  it('returns 400 when registerUser returns success: false', async () => {
    mockRegisterUser.mockResolvedValueOnce({ success: false, error: 'E-Mail bereits registriert' })
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/registriert/i)
  })

  it('returns 503 on DB connection error', async () => {
    mockRegisterUser.mockRejectedValueOnce(new Error('ECONNREFUSED to database'))
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(503)
  })

  it('returns 500 on unexpected error', async () => {
    mockRegisterUser.mockRejectedValueOnce(new Error('Unknown failure'))
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(500)
  })
})
