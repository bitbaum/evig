/**
 * @jest-environment node
 *
 * Tests for POST /api/auth/reset-password
 *
 * Mission-relevant: password reset is the last-resort account recovery path.
 * If token verification is bypassed or the wrong user's password is updated,
 * it's an account takeover vulnerability.
 *
 * Behaviors locked:
 *   POST /api/auth/reset-password
 *   - returns 429 when rate limited
 *   - returns 400 when token is invalid or expired
 *   - returns 200 on successful password reset
 *   - calls hashPassword with the new password
 *   - calls updateUserPassword with the hashed password
 *   - returns 500 when updateUserPassword fails
 *   - returns 400 on schema validation failure
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

const mockVerifyPasswordResetToken = jest.fn()
const mockUpdateUserPassword = jest.fn()

jest.mock('@/lib/auth/db', () => ({
  verifyPasswordResetToken: (...args: unknown[]) => mockVerifyPasswordResetToken.apply(null, args),
  updateUserPassword: (...args: unknown[]) => mockUpdateUserPassword.apply(null, args),
}))

const mockHashPassword = jest.fn().mockResolvedValue('$2b$10$new-hashed-password')

jest.mock('@/lib/auth/password', () => ({
  hashPassword: (...args: unknown[]) => mockHashPassword.apply(null, args),
}))

const mockSendCustomEmail = jest.fn().mockResolvedValue(undefined)
const mockPasswordChangeConfirmation = jest.fn().mockReturnValue({ subject: 'Passwort geändert', html: '', text: '' })

jest.mock('@/lib/email', () => ({
  sendCustomEmail: (...args: unknown[]) => mockSendCustomEmail.apply(null, args),
  passwordChangeConfirmation: (...args: unknown[]) => mockPasswordChangeConfirmation.apply(null, args),
}))

const mockSelectWhere = jest.fn().mockResolvedValue([{ name: 'Hans' }])
const mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere })
const mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom })

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  users: { id: 'users_id', name: 'users_name', email: 'users_email' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
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

const VALID_BODY = {
  token: 'valid-reset-token-abc',
  password: 'NewSecure99',
  confirmPassword: 'NewSecure99',
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfter: 0, remaining: 9, resetAt: 0 })
  mockVerifyPasswordResetToken.mockResolvedValue({ success: true, email: 'hans@example.com' })
  mockUpdateUserPassword.mockResolvedValue({ success: true })
  mockSelectWhere.mockResolvedValue([{ name: 'Hans' }])
})

// ============================================================================
// POST /api/auth/reset-password
// ============================================================================

describe('POST /api/auth/reset-password — rate limiting', () => {
  it('returns 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 60 })
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(429)
  })
})

describe('POST /api/auth/reset-password — token validation', () => {
  it('returns 400 when token is invalid', async () => {
    mockVerifyPasswordResetToken.mockResolvedValueOnce({ success: false, error: 'Token ungültig' })
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/ungültig/i)
  })

  it('returns 400 when token is expired (generic error)', async () => {
    mockVerifyPasswordResetToken.mockResolvedValueOnce({ success: false })
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/auth/reset-password — success', () => {
  it('returns 200 on valid token and password', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(200)
  })

  it('returns success: true with message', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.message).toMatch(/passwort/i)
  })

  it('calls hashPassword with the new password', async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mockHashPassword).toHaveBeenCalledWith('NewSecure99')
  })

  it('calls updateUserPassword with the hashed password', async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mockUpdateUserPassword).toHaveBeenCalledWith(
      'hans@example.com',
      '$2b$10$new-hashed-password',
    )
  })

  it('sends password change confirmation email (fire-and-forget)', async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mockSendCustomEmail).toHaveBeenCalledWith(
      'hans@example.com',
      expect.anything(),
    )
  })
})

describe('POST /api/auth/reset-password — schema validation', () => {
  it('returns 400 when token is missing', async () => {
    const response = await POST(makeRequest({ password: 'NewSecure99', confirmPassword: 'NewSecure99' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when passwords do not match', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, confirmPassword: 'DifferentPass1' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when password is too short (less than 8 chars)', async () => {
    const response = await POST(makeRequest({ token: 'tok', password: 'short', confirmPassword: 'short' }))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/auth/reset-password — DB/service errors', () => {
  it('returns 500 when updateUserPassword returns failure', async () => {
    mockUpdateUserPassword.mockResolvedValueOnce({ success: false })
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })

  it('returns 500 when verifyPasswordResetToken throws', async () => {
    mockVerifyPasswordResetToken.mockRejectedValueOnce(new Error('DB error'))
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(500)
  })
})
