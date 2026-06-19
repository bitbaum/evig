/**
 * @jest-environment node
 *
 * Tests for POST /api/newsletter/subscribe (public) and GET /api/newsletter/subscribe (admin)
 *
 * Behaviors locked:
 *   POST - 429 (rate limited), 400 (invalid body), 400 (already active subscriber),
 *          200 (new subscriber), 200 (re-subscribe)
 *   GET  - 401 (no session / not staff), 200 (with stats)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<unknown> }) =>
      mockAuth().then(async (session: unknown) => {
        const s = session as { user?: { isStaff?: boolean; id?: string } } | null
        if (!s?.user?.isStaff) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext)
      }),
}))

const mockCheckRateLimit = jest.fn()
const mockGetClientIp = jest.fn()

jest.mock('@/lib/auth/rate-limiter', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getClientIp: (...args: unknown[]) => mockGetClientIp(...args),
}))

const mockSendEmail = jest.fn()

jest.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

jest.mock('@/config/urls', () => ({
  APP_URL: 'https://revampit.test',
}))

jest.mock('@/config/email', () => ({
  LISTMONK_CONFIG: { URL: 'http://listmonk.test', USERNAME: 'user', PASSWORD: 'pass' },
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockInsert = jest.fn()
// Models the route's atomic-upsert chain:
//   db.insert(table).values(...).onConflictDoUpdate({...}).returning({...})
// The chain returns [row] or [] depending on whether the setWhere clause
// blocked the conflict update — set mockReturning per-test to drive each
// branch (new subscriber, re-subscribe, already-active rejection).
const mockValues = jest.fn()
const mockOnConflictDoUpdate = jest.fn()
const mockReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  newsletterSubscriptions: {
    email: 'ns_email',
    isActive: 'ns_isActive',
    confirmedAt: 'ns_confirmedAt',
    source: 'ns_source',
    createdAt: 'ns_createdAt',
    confirmToken: 'ns_confirmToken',
    unsubscribedAt: 'ns_unsubscribedAt',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  desc: (a: unknown) => ({ __desc: a }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/lib/schemas', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    validateBody: (_schema: unknown, data: unknown) => {
      const d = data as Record<string, unknown>
      if (!d?.email || typeof d.email !== 'string' || !d.email.includes('@')) {
        return { success: false as const, error: NextResponse.json({ success: false, error: 'Invalid' }, { status: 400 }) }
      }
      return { success: true as const, data: { email: d.email } }
    },
    NewsletterSubscribeSchema: {},
  }
})

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiSuccessCached: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiRateLimited: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 429 }),
    apiNotFound: (resource: string) => NextResponse.json({ success: false, error: `${resource} not found` }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

const MOCK_STAFF_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[] },
  expires: '2027-01-01',
}

beforeEach(() => {
  jest.resetAllMocks()

  mockAuth.mockResolvedValue(MOCK_STAFF_SESSION)
  mockGetClientIp.mockReturnValue('127.0.0.1')
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfter: 0, remaining: 10, resetAt: 0 })
  mockSendEmail.mockResolvedValue({ success: true, messageId: 'test-msg' })

  // Set up select chain
  mockWhere.mockResolvedValue([])
  mockFrom.mockReturnValue({ where: mockWhere })
  mockSelect.mockReturnValue({ from: mockFrom })

  // Set up orderBy chain for GET
  mockOrderBy.mockResolvedValue([])
  mockFrom.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy })

  // insert chain: .values() -> .onConflictDoUpdate() -> .returning() -> [row]
  // Default = new subscriber (one inactive row written). Tests override
  // mockReturning to model already-active (empty array) or re-subscribe.
  mockReturning.mockResolvedValue([{ isActive: false, confirmedAt: null }])
  mockOnConflictDoUpdate.mockReturnValue({ returning: mockReturning })
  mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate })
})

// ============================================================================
// POST — public subscribe
// ============================================================================

describe('POST /api/newsletter/subscribe — rate limiting', () => {
  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 60, remaining: 0, resetAt: 0 })
    const req = new NextRequest('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(429)
  })
})

describe('POST /api/newsletter/subscribe — validation', () => {
  it('returns 400 when body is invalid (no email)', async () => {
    const req = new NextRequest('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email: 'notanemail' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

describe('POST /api/newsletter/subscribe — already active subscriber', () => {
  it('returns 400 when subscriber is already active', async () => {
    // setWhere clause blocks the conflict-update on already-confirmed rows,
    // so the upsert resolves with an empty returning() array.
    mockReturning.mockResolvedValueOnce([])
    const req = new NextRequest('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email: 'active@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/bereits registriert/i)
  })
})

describe('POST /api/newsletter/subscribe — new subscriber', () => {
  it('returns 200 when new subscriber is created', async () => {
    // Default mockReturning resolution = new-subscriber row.
    const req = new NextRequest('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(mockInsert).toHaveBeenCalledTimes(1)
    expect(mockOnConflictDoUpdate).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/newsletter/subscribe — email failure', () => {
  it('degrades gracefully (200, confirmed:false, "Bestätigung folgt") and logs a warning when sendEmail fails', async () => {
    // Contract: the DB row was already inserted as pending before the email
    // send, so a failed confirmation email must NOT surface as a scary 502 the
    // user can't act on. The route returns 200 and records the failure via
    // logger.warn so the silent-failure-is-logged guarantee stays locked.
    const { logger } = jest.requireMock('@/lib/logger')
    mockSendEmail.mockResolvedValueOnce({ success: false, error: 'SMTP rejected' })

    const req = new NextRequest('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email: 'fail@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.confirmed).toBe(false)
    expect(body.data.message).toMatch(/Bestätigung folgt/i)
    expect(logger.warn).toHaveBeenCalled()
  })
})

describe('POST /api/newsletter/subscribe — re-subscribe', () => {
  it('returns 200 when re-subscribing (existing but inactive)', async () => {
    // Existing inactive row gets overwritten via ON CONFLICT DO UPDATE,
    // returning a fresh inactive row.
    mockReturning.mockResolvedValueOnce([{ isActive: false, confirmedAt: null }])

    const req = new NextRequest('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email: 'returning@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(mockInsert).toHaveBeenCalledTimes(1)
    expect(mockOnConflictDoUpdate).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// GET — admin subscriber list
// ============================================================================

describe('GET /api/newsletter/subscribe — unauthenticated', () => {
  it('returns 401 when no session', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/newsletter/subscribe')
    const response = await GET(req)
    expect(response.status).toBe(401)
  })

  it('returns 401 when user is not staff', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'user@example.com', isStaff: false, staffPermissions: [] },
      expires: '2027-01-01',
    })
    const req = new NextRequest('http://localhost/api/newsletter/subscribe')
    const response = await GET(req)
    expect(response.status).toBe(401)
  })
})

describe('GET /api/newsletter/subscribe — admin', () => {
  it('returns 200 with subscriber stats', async () => {
    const subscribers = [
      { email: 'a@test.com', isActive: true, confirmedAt: new Date(), source: 'website', createdAt: new Date() },
      { email: 'b@test.com', isActive: false, confirmedAt: null, source: 'website', createdAt: new Date() },
    ]
    // For the GET handler, the select chain uses orderBy
    const mockOrderByFn = jest.fn().mockResolvedValue(subscribers)
    mockFrom.mockReturnValue({ orderBy: mockOrderByFn, where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const req = new NextRequest('http://localhost/api/newsletter/subscribe')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.total).toBe(2)
    expect(body.data.active).toBe(1)
    expect(body.data.pending).toBe(1)
  })
})
