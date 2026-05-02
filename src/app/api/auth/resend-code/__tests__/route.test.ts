/**
 * @jest-environment node
 *
 * Tests for POST /api/auth/resend-code
 *
 * Mission-relevant: resend-code is the lifeline when verification emails
 * are lost. If it reveals whether an email is registered, it's an
 * enumeration vulnerability. If already-verified users can trigger resends,
 * spam risk increases.
 *
 * Behaviors locked:
 *   POST /api/auth/resend-code
 *   - returns 429 when rate limited
 *   - returns 400 on invalid email (validation failure)
 *   - returns 200 with same message whether email exists or not
 *   - returns 400 when user is already verified
 *   - returns 200 and sends code when user exists and is unverified
 *   - returns 500 when email send fails
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

const mockGetUserByEmail = jest.fn()
const mockCreateVerificationCode = jest.fn().mockResolvedValue('654321')

jest.mock('@/lib/auth/db', () => ({
  getUserByEmail: (...args: unknown[]) => mockGetUserByEmail.apply(null, args),
  createVerificationCode: (...args: unknown[]) => mockCreateVerificationCode.apply(null, args),
}))

const mockSendEmail = jest.fn()

jest.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail.apply(null, args),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => ({
  apiSuccess: (data: unknown) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: true, data })
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

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/resend-code', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const UNVERIFIED_USER = { id: 'user-1', name: 'Hans', email: 'hans@example.com', emailVerified: null }
const VERIFIED_USER = { id: 'user-2', name: 'Anna', email: 'anna@example.com', emailVerified: new Date() }

beforeEach(() => {
  jest.clearAllMocks()
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfter: 0, remaining: 4, resetAt: 0 })
  mockGetUserByEmail.mockResolvedValue(UNVERIFIED_USER)
  mockSendEmail.mockResolvedValue({ success: true })
})

// ============================================================================
// POST /api/auth/resend-code
// ============================================================================

describe('POST /api/auth/resend-code — rate limiting', () => {
  it('returns 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 3600, remaining: 0, resetAt: 0 })
    const response = await POST(makeRequest({ email: 'hans@example.com' }))
    expect(response.status).toBe(429)
  })
})

describe('POST /api/auth/resend-code — validation', () => {
  it('returns 400 when email is invalid format', async () => {
    const response = await POST(makeRequest({ email: 'not-an-email' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when email is missing', async () => {
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/auth/resend-code — enumeration protection', () => {
  it('returns 200 when email is not registered', async () => {
    mockGetUserByEmail.mockResolvedValueOnce(null)
    const response = await POST(makeRequest({ email: 'ghost@example.com' }))
    expect(response.status).toBe(200)
  })

  it('does not call createVerificationCode when user not found', async () => {
    mockGetUserByEmail.mockResolvedValueOnce(null)
    await POST(makeRequest({ email: 'ghost@example.com' }))
    expect(mockCreateVerificationCode).not.toHaveBeenCalled()
  })

  it('returns success: true whether user exists or not', async () => {
    mockGetUserByEmail.mockResolvedValueOnce(null)
    const notFoundResponse = await POST(makeRequest({ email: 'ghost@example.com' }))
    const notFoundBody = await notFoundResponse.json()
    expect(notFoundBody.success).toBe(true)
  })
})

describe('POST /api/auth/resend-code — already verified', () => {
  it('returns 400 when user is already verified', async () => {
    mockGetUserByEmail.mockResolvedValueOnce(VERIFIED_USER)
    const response = await POST(makeRequest({ email: 'anna@example.com' }))
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/bestätigt/i)
  })
})

describe('POST /api/auth/resend-code — success', () => {
  it('returns 200 when code is sent successfully', async () => {
    const response = await POST(makeRequest({ email: 'hans@example.com' }))
    expect(response.status).toBe(200)
  })

  it('calls createVerificationCode with the user email', async () => {
    await POST(makeRequest({ email: 'hans@example.com' }))
    expect(mockCreateVerificationCode).toHaveBeenCalledWith('hans@example.com')
  })

  it('calls sendEmail with the generated code', async () => {
    await POST(makeRequest({ email: 'hans@example.com' }))
    expect(mockSendEmail).toHaveBeenCalledWith(
      'hans@example.com',
      'verificationCode',
      expect.any(String),
      '654321',
    )
  })
})

describe('POST /api/auth/resend-code — email failure', () => {
  it('returns 500 when sendEmail returns failure', async () => {
    mockSendEmail.mockResolvedValueOnce({ success: false, error: 'SMTP error' })
    const response = await POST(makeRequest({ email: 'hans@example.com' }))
    expect(response.status).toBe(500)
  })

  it('returns 500 when sendEmail throws', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('connection refused'))
    const response = await POST(makeRequest({ email: 'hans@example.com' }))
    expect(response.status).toBe(500)
  })
})
