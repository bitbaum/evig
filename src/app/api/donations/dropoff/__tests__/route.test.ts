/**
 * @jest-environment node
 *
 * Tests for POST /api/donations/dropoff
 *
 * Behaviors locked:
 *   - 200 on valid dropoff announcement, both emails sent
 *   - 400 on invalid input (missing required fields)
 *   - 429 when rate limit is exceeded
 *   - confirmation goes to the donor, notification to CONTACT.email
 *   - emails are fire-and-forget — a rejected sendCustomEmail still returns 200
 */

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

jest.mock('@/lib/email/templates/donation-dropoff', () => ({
  donationDropoffNotification: jest.fn().mockReturnValue({ subject: 'Notification', html: '', text: '' }),
  donationDropoffConfirmation: jest.fn().mockReturnValue({ subject: 'Confirmation', html: '', text: '' }),
}))

jest.mock('@/config/org', () => ({
  CONTACT: { email: 'kontakt@revamp-it.ch' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiBadRequest: (msg: string, details?: unknown) =>
      NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiRateLimited: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 429 }),
  }
})

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    RATE_LIMITED: 'Zu viele Anfragen',
    INVALID_INPUT: 'Ungültige Eingabe',
  },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const VALID_BODY = {
  name: 'Anna Müller',
  email: 'anna@example.com',
  phone: '+41 79 123 45 67',
  preferredDate: '2026-06-15',
  devices: 'Zwei alte ThinkPads + ein Monitor',
  notes: 'Akku vom Laptop ist defekt',
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/donations/dropoff', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetClientIp.mockReturnValue('127.0.0.1')
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfter: 0, remaining: 10, resetAt: 0 })
  mockSendCustomEmail.mockResolvedValue(undefined)
})

describe('POST /api/donations/dropoff', () => {
  it('returns 200 on a valid full submission', async () => {
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('sends notification to CONTACT.email and confirmation to the donor', async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mockSendCustomEmail).toHaveBeenCalledTimes(2)
    const firstRecipient = (mockSendCustomEmail.mock.calls[0] as [string, unknown])[0]
    const secondRecipient = (mockSendCustomEmail.mock.calls[1] as [string, unknown])[0]
    expect(firstRecipient).toBe('kontakt@revamp-it.ch')
    expect(secondRecipient).toBe('anna@example.com')
  })

  it('accepts a minimal valid submission (optional fields omitted)', async () => {
    const res = await POST(
      makeRequest({
        name: 'Beat',
        email: 'beat@example.com',
        devices: 'Ein alter Drucker, ein Bildschirm',
      }),
    )
    expect(res.status).toBe(200)
  })

  it('returns 400 when name is missing', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, name: undefined }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when email is invalid', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when devices description is too short', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, devices: 'kurz' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when preferredDate is not YYYY-MM-DD', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, preferredDate: '15/06/2026' }))
    expect(res.status).toBe(400)
  })

  it('returns 429 when rate-limit blocks the request', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 60, remaining: 0, resetAt: 0 })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(429)
  })

  it('still returns 200 when sendCustomEmail rejects (fire-and-forget)', async () => {
    mockSendCustomEmail.mockRejectedValue(new Error('SMTP down'))
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
  })

  it('still returns 200 when sendCustomEmail resolves { success: false } — but logs the resolved failure', async () => {
    // sendCustomEmail RESOLVES with {success:false} on SMTP failure rather
    // than throwing. A bare `.catch()` would miss this — the route uses a
    // `.then()` to detect resolved-failure and log it. Without this lock
    // a refactor could silently revert to the bare-catch shape (the bug
    // I just shipped in a8cc473c and fixed adjacent).
    const { logger } = jest.requireMock('@/lib/logger') as { logger: { warn: jest.Mock } }
    mockSendCustomEmail.mockResolvedValue({ success: false, error: 'Listmonk 500' })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)

    // Give the fire-and-forget .then() chain a tick to flush
    await new Promise(r => setImmediate(r))

    const resolvedFailureLogs = logger.warn.mock.calls.filter(
      (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('(resolved)'),
    )
    expect(resolvedFailureLogs.length).toBeGreaterThanOrEqual(2)
  })
})
