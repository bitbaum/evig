/**
 * @jest-environment node
 *
 * Tests for POST /api/auth/forgot-password
 *
 * Mission-relevant: password reset is a security-critical flow. The response
 * must not reveal whether an email is registered (enumeration attack prevention).
 * Token creation and email delivery must be called correctly for the flow to work.
 *
 * Behaviors locked:
 *   POST /api/auth/forgot-password
 *   - returns 429 when rate limited
 *   - returns 200 (with same message) whether email exists or not
 *   - calls createPasswordResetToken when user is found
 *   - does NOT call createPasswordResetToken when user is not found
 *   - returns 200 even when email sending fails (no enumeration)
 *   - returns 400 on invalid email format
 *   - returns 500 on unexpected DB error
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
const mockCreatePasswordResetToken = jest.fn().mockResolvedValue('reset-token-abc')

jest.mock('@/lib/auth/db', () => ({
  getUserByEmail: (...args: unknown[]) => mockGetUserByEmail.apply(null, args),
  createPasswordResetToken: (...args: unknown[]) => mockCreatePasswordResetToken.apply(null, args),
}))

const mockSendEmail = jest.fn().mockResolvedValue(undefined)

jest.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail.apply(null, args),
}))

jest.mock('@/config/org', () => ({
  ORG: { name: 'RevampIT' },
  CONTACT: { email: 'kontakt@revamp-it.ch' },
  LOCATIONS: {
    store: { street: 'Birmensdorferstrasse 379', postalCode: '8055', city: 'Zürich', canton: 'Zürich' },
  },
}))

jest.mock('@/config/urls', () => ({
  getPasswordResetUrl: jest.fn((token: string) => `https://example.com/reset?token=${token}`),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
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

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const MOCK_USER = { id: 'user-1', name: 'Hans', email: 'hans@example.com' }

beforeEach(() => {
  jest.clearAllMocks()
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfter: 0, remaining: 9, resetAt: 0 })
  mockGetUserByEmail.mockResolvedValue(MOCK_USER)
  mockSendEmail.mockResolvedValue(undefined)
})

// ============================================================================
// POST /api/auth/forgot-password
// ============================================================================

describe('POST /api/auth/forgot-password — rate limiting', () => {
  it('returns 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 60 })
    const response = await POST(makeRequest({ email: 'hans@example.com' }))
    expect(response.status).toBe(429)
  })

  it('does not call getUserByEmail when rate limited', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 60 })
    await POST(makeRequest({ email: 'hans@example.com' }))
    expect(mockGetUserByEmail).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/forgot-password — user not found (enumeration protection)', () => {
  it('returns 200 even when email is not registered', async () => {
    mockGetUserByEmail.mockResolvedValueOnce(null)
    const response = await POST(makeRequest({ email: 'unknown@example.com' }))
    expect(response.status).toBe(200)
  })

  it('does not call createPasswordResetToken when user is not found', async () => {
    mockGetUserByEmail.mockResolvedValueOnce(null)
    await POST(makeRequest({ email: 'unknown@example.com' }))
    expect(mockCreatePasswordResetToken).not.toHaveBeenCalled()
  })

  it('response message is identical whether user exists or not', async () => {
    mockGetUserByEmail.mockResolvedValueOnce(null)
    const notFoundResponse = await POST(makeRequest({ email: 'nope@example.com' }))
    const notFoundBody = await notFoundResponse.json()

    mockGetUserByEmail.mockResolvedValueOnce(MOCK_USER)
    const foundResponse = await POST(makeRequest({ email: 'hans@example.com' }))
    const foundBody = await foundResponse.json()

    expect(notFoundBody.data.message).toBe(foundBody.data.message)
  })
})

describe('POST /api/auth/forgot-password — user found', () => {
  it('returns 200 on success', async () => {
    const response = await POST(makeRequest({ email: 'hans@example.com' }))
    expect(response.status).toBe(200)
  })

  it('calls createPasswordResetToken with the user email', async () => {
    await POST(makeRequest({ email: 'hans@example.com' }))
    expect(mockCreatePasswordResetToken).toHaveBeenCalledWith('hans@example.com')
  })

  it('calls sendEmail with the user email and reset token', async () => {
    await POST(makeRequest({ email: 'hans@example.com' }))
    expect(mockSendEmail).toHaveBeenCalledWith(
      'hans@example.com',
      'passwordReset',
      expect.any(String),
      expect.stringContaining('reset-token-abc'),
    )
  })

  it('returns 200 even when sendEmail throws (enumeration protection)', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP error'))
    const response = await POST(makeRequest({ email: 'hans@example.com' }))
    expect(response.status).toBe(200)
  })
})

describe('POST /api/auth/forgot-password — validation errors', () => {
  it('returns 400 for invalid email format', async () => {
    const response = await POST(makeRequest({ email: 'not-an-email' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when email is missing', async () => {
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/auth/forgot-password — DB error', () => {
  it('returns 500 when getUserByEmail throws', async () => {
    mockGetUserByEmail.mockRejectedValueOnce(new Error('DB timeout'))
    const response = await POST(makeRequest({ email: 'hans@example.com' }))
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})
