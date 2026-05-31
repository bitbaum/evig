/**
 * @jest-environment node
 *
 * Tests for POST /api/inquiry
 *
 * Mission-relevant: the inquiry form is the primary contact channel for
 * potential donors, workshop participants, and tech donors. If validation
 * fails silently or emails are not sent, RevampIT never sees inbound interest.
 *
 * Behaviors locked:
 *   POST /api/inquiry
 *   - returns 200 on valid inquiry submission
 *   - returns 400 on invalid input (missing required fields)
 *   - returns 429 when rate limit is exceeded
 *   - sends admin notification email (fire-and-forget)
 *   - sends confirmation email to submitter (fire-and-forget)
 *   - returns 500 on unexpected error
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCheckRateLimit = jest.fn()
const mockGetClientIp = jest.fn().mockReturnValue('127.0.0.1')

jest.mock('@/lib/auth/rate-limiter', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit.apply(null, args),
  getClientIp: (...args: unknown[]) => mockGetClientIp.apply(null, args),
}))

const mockSendCustomEmail = jest.fn().mockResolvedValue(undefined)

jest.mock('@/lib/email', () => ({
  sendCustomEmail: (...args: unknown[]) => mockSendCustomEmail.apply(null, args),
}))

jest.mock('@/lib/email/templates/inquiry', () => ({
  inquiryNotification: jest.fn().mockReturnValue({ subject: 'Notification', html: '', text: '' }),
  inquiryConfirmation: jest.fn().mockReturnValue({ subject: 'Confirmation', html: '', text: '' }),
}))

jest.mock('@/config/org', () => ({
  CONTACT: { email: 'kontakt@revamp-it.ch' },
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

const VALID_BODY = {
  name: 'Hans Müller',
  email: 'hans@example.com',
  message: 'Ich möchte mehr über eure Workshops erfahren.',
  topic: 'workshops',
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/inquiry', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfter: 0, remaining: 9, resetAt: 0 })
  mockSendCustomEmail.mockResolvedValue(undefined)
})

// ============================================================================
// POST /api/inquiry
// ============================================================================

describe('POST /api/inquiry — success', () => {
  it('returns 200 on valid submission', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(200)
  })

  it('returns success: true', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('sends admin notification email', async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mockSendCustomEmail).toHaveBeenCalledWith(
      'kontakt@revamp-it.ch',
      expect.anything(),
    )
  })

  it('sends confirmation email to submitter', async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mockSendCustomEmail).toHaveBeenCalledWith(
      'hans@example.com',
      expect.anything(),
    )
  })

  it('calls sendCustomEmail twice (admin + submitter)', async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mockSendCustomEmail).toHaveBeenCalledTimes(2)
  })
})

describe('POST /api/inquiry — validation errors', () => {
  it('returns 400 when name is missing', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, name: undefined }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when email is invalid', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, email: 'not-an-email' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when message is too short', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, message: 'too short' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when topic is missing', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, topic: undefined }))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/inquiry — rate limiting', () => {
  it('returns 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 60, remaining: 0, resetAt: 0 })
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(429)
  })

  it('does not send emails when rate limited', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 60, remaining: 0, resetAt: 0 })
    await POST(makeRequest(VALID_BODY))
    expect(mockSendCustomEmail).not.toHaveBeenCalled()
  })
})

describe('POST /api/inquiry — unexpected error', () => {
  it('returns 500 when sendCustomEmail.then throws synchronously', async () => {
    mockSendCustomEmail.mockImplementationOnce(() => {
      throw new Error('unexpected')
    })
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(500)
  })
})

describe('POST /api/inquiry — resolved-failure swallow lock', () => {
  it('still returns 200 when sendCustomEmail resolves { success: false } — but logs the resolved failure', async () => {
    // Regression lock for the swallow pattern fixed adjacent to a4f2d601:
    // sendCustomEmail resolves {success:false} on SMTP failure rather than
    // throwing. A bare `.catch()` would miss this — the route uses
    // `.then(r => if !r.success warn)` to detect resolved-failure. Without
    // this assertion a refactor could silently revert to bare-catch.
    const { logger } = jest.requireMock('@/lib/logger') as { logger: { warn: jest.Mock } }
    mockSendCustomEmail.mockResolvedValue({ success: false, error: 'Listmonk 500' })

    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(200)

    // Flush the fire-and-forget .then() chain
    await new Promise(r => setImmediate(r))

    const resolvedFailureLogs = logger.warn.mock.calls.filter(
      (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('(resolved)'),
    )
    expect(resolvedFailureLogs.length).toBeGreaterThanOrEqual(2)
  })
})
