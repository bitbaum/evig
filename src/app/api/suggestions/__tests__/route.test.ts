/**
 * @jest-environment node
 *
 * Tests for POST /api/suggestions
 *
 * Mission-relevant: the suggestions/feedback form is the primary channel for
 * site visitors to report problems and share ideas. HTML escaping is required
 * here because user content is interpolated into email HTML bodies — a missing
 * escape would allow stored-XSS in admin email clients.
 *
 * Behaviors locked:
 *   POST /api/suggestions
 *   - returns 200 on valid suggestion
 *   - returns 400 when rate limited
 *   - returns 400 on invalid input (empty suggestion)
 *   - sends team notification email (fire-and-forget)
 *   - sends confirmation email when contact is a valid email
 *   - does NOT send confirmation when contact is absent or non-email
 *   - HTML-escapes user content before interpolating into email
 *   - returns 500 on unexpected error
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockApiGeneral = jest.fn().mockReturnValue(true) // true = allowed

jest.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: { apiGeneral: (...args: unknown[]) => mockApiGeneral.apply(null, args) },
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
}))

const mockSendCustomEmail = jest.fn().mockResolvedValue({ success: true })

jest.mock('@/lib/email', () => ({
  sendCustomEmail: (...args: unknown[]) => mockSendCustomEmail.apply(null, args),
}))

// Persistence + notification + auth are best-effort side channels — stub them
// so the route's email behavior (the subject of these tests) is exercised.
jest.mock('@/auth', () => ({ auth: () => Promise.resolve(null) }))
jest.mock('@/db', () => ({
  db: {
    insert: () => ({ values: () => Promise.resolve() }),
    select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
  },
}))
jest.mock('@/db/schema', () => ({ siteSuggestions: {}, users: {} }))
jest.mock('@/lib/services/notifications', () => ({ createNotification: jest.fn().mockResolvedValue(undefined) }))
jest.mock('@/lib/permissions', () => ({ SUPER_ADMIN_EMAILS: [] }))

jest.mock('@/config/org', () => ({
  CONTACT: { email: 'kontakt@revamp-it.ch' },
  ORG: { name: 'RevampIT' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

const mockEscapeHtml = jest.fn((s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;'))

jest.mock('@/lib/utils/escape-html', () => ({
  escapeHtml: (s: unknown) => mockEscapeHtml(s as string),
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
  apiRateLimited: (msg = 'Zu viele Anfragen. Bitte versuche es später erneut.') => {
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
  return new NextRequest('http://localhost/api/suggestions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const VALID_BODY = {
  suggestion: 'Die Webseite ist sehr nützlich, aber die Navigation könnte besser sein.',
  contact: 'user@example.com',
  page: '/workshops',
  topic: 'ux',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockApiGeneral.mockReturnValue(true)
  mockSendCustomEmail.mockResolvedValue(undefined)
  mockEscapeHtml.mockImplementation((s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
})

// ============================================================================
// POST /api/suggestions
// ============================================================================

describe('POST /api/suggestions — success', () => {
  it('returns 200 on valid suggestion', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(200)
  })

  it('returns success: true', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('sends team notification email to CONTACT.email', async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mockSendCustomEmail).toHaveBeenCalledWith(
      'kontakt@revamp-it.ch',
      expect.anything(),
    )
  })

  it('sends confirmation email when contact is a valid email', async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mockSendCustomEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.anything(),
    )
  })

  it('calls sendCustomEmail twice (team + submitter) when contact is email', async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mockSendCustomEmail).toHaveBeenCalledTimes(2)
  })

  it('sends only team email (no confirmation) when contact is absent', async () => {
    const { contact: _omit, ...bodyWithoutContact } = VALID_BODY
    await POST(makeRequest(bodyWithoutContact))
    expect(mockSendCustomEmail).toHaveBeenCalledTimes(1)
    expect(mockSendCustomEmail).toHaveBeenCalledWith('kontakt@revamp-it.ch', expect.anything())
  })

  it('sends only team email when contact is not an email address', async () => {
    await POST(makeRequest({ ...VALID_BODY, contact: 'just a name' }))
    expect(mockSendCustomEmail).toHaveBeenCalledTimes(1)
  })

  it('calls escapeHtml to sanitize user content for email HTML bodies', async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mockEscapeHtml).toHaveBeenCalled()
  })
})

describe('POST /api/suggestions — validation errors', () => {
  it('returns 400 when suggestion is empty string', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, suggestion: '' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when suggestion field is missing', async () => {
    const response = await POST(makeRequest({ contact: 'user@example.com' }))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/suggestions — rate limiting', () => {
  it('returns 429 when rate limit exceeded', async () => {
    mockApiGeneral.mockReturnValueOnce(false)
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(429)
  })

  it('does not send any emails when rate limited', async () => {
    mockApiGeneral.mockReturnValueOnce(false)
    await POST(makeRequest(VALID_BODY))
    expect(mockSendCustomEmail).not.toHaveBeenCalled()
  })
})

describe('POST /api/suggestions — unexpected error', () => {
  it('returns 500 when sendCustomEmail throws synchronously', async () => {
    mockSendCustomEmail.mockImplementationOnce(() => {
      throw new Error('SMTP down')
    })
    const response = await POST(makeRequest(VALID_BODY))
    expect(response.status).toBe(500)
  })
})
