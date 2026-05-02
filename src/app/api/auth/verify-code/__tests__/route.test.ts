/**
 * @jest-environment node
 *
 * Tests for POST /api/auth/verify-code
 *
 * Mission-relevant: code verification is the 6-digit OTP step in the signup
 * flow. A broken verification blocks all new user onboarding. The wrong
 * welcome email (staff vs. regular) means staff members don't receive their
 * onboarding instructions.
 *
 * Behaviors locked:
 *   POST /api/auth/verify-code
 *   - returns 429 when rate limited
 *   - returns 400 on invalid input (missing email or code)
 *   - returns 400 when verifyEmailCode fails
 *   - returns 200 on successful verification
 *   - sends staffWelcome email for @revamp-it.ch addresses
 *   - sends regular welcome email for non-staff addresses
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

const mockVerifyEmailCode = jest.fn()

jest.mock('@/lib/auth/db', () => ({
  verifyEmailCode: (...args: unknown[]) => mockVerifyEmailCode.apply(null, args),
}))

const mockSendCustomEmail = jest.fn().mockResolvedValue(undefined)
const mockStaffWelcome = jest.fn().mockReturnValue({ subject: 'Willkommen Staff', html: '', text: '' })
const mockWelcome = jest.fn().mockReturnValue({ subject: 'Willkommen', html: '', text: '' })

jest.mock('@/lib/email', () => ({
  sendCustomEmail: (...args: unknown[]) => mockSendCustomEmail.apply(null, args),
  staffWelcome: (...args: unknown[]) => mockStaffWelcome.apply(null, args),
  welcome: (...args: unknown[]) => mockWelcome.apply(null, args),
}))

jest.mock('@/lib/permissions', () => ({
  isStaffEmail: jest.fn((email: string) => email.endsWith('@revamp-it.ch')),
}))

const mockSelectWhere = jest.fn().mockResolvedValue([{ name: 'Hans' }])
const mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere })
const mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom })

jest.mock('@/db', () => ({
  db: { select: (...args: unknown[]) => mockSelect.apply(null, args) },
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
  return new NextRequest('http://localhost/api/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const VALID_BODY = { email: 'user@example.com', code: '123456' }

beforeEach(() => {
  jest.clearAllMocks()
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfter: 0, remaining: 4, resetAt: 0 })
  mockVerifyEmailCode.mockResolvedValue({ success: true })
  mockSelectWhere.mockResolvedValue([{ name: 'Hans' }])
  mockSendCustomEmail.mockResolvedValue(undefined)
})

// ============================================================================
// POST /api/auth/verify-code
// ============================================================================

describe('POST /api/auth/verify-code — rate limiting', () => {
  it('returns 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 60, remaining: 0, resetAt: 0 })
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(429)
  })
})

describe('POST /api/auth/verify-code — validation', () => {
  it('returns 400 when email is missing', async () => {
    const response = await POST(makeRequest({ code: '123456' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when code is missing', async () => {
    const response = await POST(makeRequest({ email: 'user@example.com' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when code is not 6 digits', async () => {
    const response = await POST(makeRequest({ email: 'user@example.com', code: '123' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when code contains letters', async () => {
    const response = await POST(makeRequest({ email: 'user@example.com', code: '12345a' }))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/auth/verify-code — verification failure', () => {
  it('returns 400 when code is wrong', async () => {
    mockVerifyEmailCode.mockResolvedValueOnce({ success: false, error: 'Falscher Code' })
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/falscher/i)
  })
})

describe('POST /api/auth/verify-code — success (regular user)', () => {
  it('returns 200 on valid code', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(200)
  })

  it('returns success: true and verified: true', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.verified).toBe(true)
  })

  it('sends regular welcome email for non-staff address', async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mockWelcome).toHaveBeenCalled()
    expect(mockStaffWelcome).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/verify-code — success (staff user)', () => {
  it('sends staffWelcome for @revamp-it.ch address', async () => {
    await POST(makeRequest({ email: 'staff@revamp-it.ch', code: '654321' }))
    expect(mockStaffWelcome).toHaveBeenCalled()
    expect(mockWelcome).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/verify-code — unexpected error', () => {
  it('returns 500 when verifyEmailCode throws', async () => {
    mockVerifyEmailCode.mockRejectedValueOnce(new Error('DB down'))
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(500)
  })
})
