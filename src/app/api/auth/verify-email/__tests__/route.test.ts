/**
 * @jest-environment node
 *
 * Tests for POST /api/auth/verify-email and GET /api/auth/verify-email
 *
 * Mission-relevant: email verification is the double-opt-in step after
 * registration. If the token check fails silently or the wrong welcome email
 * is sent, staff members don't get their onboarding email and regular users
 * may get staff-level content.
 *
 * Behaviors locked:
 *   POST /api/auth/verify-email
 *   - returns 400 when token is missing or empty
 *   - returns 400 when verifyEmailWithToken fails
 *   - returns 200 on successful verification
 *   - sends staffWelcome email for @revamp-it.ch addresses
 *   - sends regular welcome email for non-staff addresses
 *   GET /api/auth/verify-email
 *   - redirects to /auth/login?verified=true on success
 *   - redirects to /auth/login?error=invalid_token when token is absent
 *   - redirects to /auth/login?error=verification_failed when token is invalid
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockVerifyEmailWithToken = jest.fn()

jest.mock('@/lib/auth/db', () => ({
  verifyEmailWithToken: (...args: unknown[]) => mockVerifyEmailWithToken.apply(null, args),
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
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST, GET } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

function makeGetRequest(token?: string) {
  const url = new URL('http://localhost/api/auth/verify-email')
  if (token !== undefined) url.searchParams.set('token', token)
  return new NextRequest(url.toString())
}

beforeEach(() => {
  jest.clearAllMocks()
  mockVerifyEmailWithToken.mockResolvedValue({ success: true, email: 'hans@example.com' })
  mockSelectWhere.mockResolvedValue([{ name: 'Hans' }])
  mockSendCustomEmail.mockResolvedValue(undefined)
})

// ============================================================================
// POST /api/auth/verify-email
// ============================================================================

describe('POST /api/auth/verify-email — validation', () => {
  it('returns 400 when token is empty string', async () => {
    const response = await POST(makePostRequest({ token: '' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when token field is missing', async () => {
    const response = await POST(makePostRequest({}))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/auth/verify-email — invalid token', () => {
  it('returns 400 when verifyEmailWithToken fails', async () => {
    mockVerifyEmailWithToken.mockResolvedValueOnce({ success: false, error: 'Token ungültig' })
    const response = await POST(makePostRequest({ token: 'bad-token' }))
    expect(response.status).toBe(400)
  })

  it('error message comes from verifyEmailWithToken result', async () => {
    mockVerifyEmailWithToken.mockResolvedValueOnce({ success: false, error: 'Token abgelaufen' })
    const response = await POST(makePostRequest({ token: 'expired' }))
    const body = await response.json()
    expect(body.error).toMatch(/abgelaufen/i)
  })
})

describe('POST /api/auth/verify-email — success (regular user)', () => {
  it('returns 200 on valid token', async () => {
    const response = await POST(makePostRequest({ token: 'valid-token' }))
    expect(response.status).toBe(200)
  })

  it('returns success: true', async () => {
    const response = await POST(makePostRequest({ token: 'valid-token' }))
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('sends regular welcome email for non-staff address', async () => {
    mockVerifyEmailWithToken.mockResolvedValueOnce({ success: true, email: 'user@example.com' })
    await POST(makePostRequest({ token: 'valid-token' }))
    expect(mockWelcome).toHaveBeenCalled()
    expect(mockStaffWelcome).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/verify-email — success (staff user)', () => {
  it('sends staffWelcome email for @revamp-it.ch address', async () => {
    mockVerifyEmailWithToken.mockResolvedValueOnce({ success: true, email: 'staff@revamp-it.ch' })
    await POST(makePostRequest({ token: 'staff-token' }))
    expect(mockStaffWelcome).toHaveBeenCalled()
    expect(mockWelcome).not.toHaveBeenCalled()
  })

  it('sends email to the verified staff address', async () => {
    mockVerifyEmailWithToken.mockResolvedValueOnce({ success: true, email: 'staff@revamp-it.ch' })
    await POST(makePostRequest({ token: 'staff-token' }))
    expect(mockSendCustomEmail).toHaveBeenCalledWith('staff@revamp-it.ch', expect.anything())
  })
})

describe('POST /api/auth/verify-email — unexpected error', () => {
  it('returns 500 when verifyEmailWithToken throws', async () => {
    mockVerifyEmailWithToken.mockRejectedValueOnce(new Error('DB down'))
    const response = await POST(makePostRequest({ token: 'any-token' }))
    expect(response.status).toBe(500)
  })
})

// ============================================================================
// GET /api/auth/verify-email
// ============================================================================

describe('GET /api/auth/verify-email — missing token', () => {
  it('redirects to /auth/login?error=invalid_token when token is absent', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('error=invalid_token')
  })
})

describe('GET /api/auth/verify-email — invalid token', () => {
  it('redirects to /auth/login?error=verification_failed when token is bad', async () => {
    mockVerifyEmailWithToken.mockResolvedValueOnce({ success: false })
    const response = await GET(makeGetRequest('bad-token'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('error=verification_failed')
  })
})

describe('GET /api/auth/verify-email — valid token', () => {
  it('redirects to /auth/login?verified=true on success', async () => {
    const response = await GET(makeGetRequest('valid-token'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('verified=true')
  })

  it('sends welcome email to the verified address', async () => {
    mockVerifyEmailWithToken.mockResolvedValueOnce({ success: true, email: 'user@example.com' })
    await GET(makeGetRequest('valid-token'))
    expect(mockSendCustomEmail).toHaveBeenCalledWith('user@example.com', expect.anything())
  })
})
