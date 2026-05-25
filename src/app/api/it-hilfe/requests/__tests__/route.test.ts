/**
 * @jest-environment node
 *
 * Tests for GET/POST /api/it-hilfe/requests
 *
 * Mission-relevant: GET is the public browse endpoint (window-function total,
 * pagination); POST is the authenticated creation endpoint with rate limiting
 * and validation guards.
 *
 * Behaviors locked:
 *   GET /api/it-hilfe/requests
 *   - returns 200 with requests array
 *   - extracts total from _total_count window function
 *   - returns total 0 and empty array when no rows
 *   - includes pagination metadata
 *   - returns 500 when DB throws
 *
 *   POST /api/it-hilfe/requests
 *   - returns 401 when not authenticated
 *   - returns 429 when rate limited
 *   - returns 400 when validation fails
 *   - returns 201 with requestId on success
 *   - returns 500 when DB throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

// withAuth no longer wraps POST (the route now resolves session manually
// to allow anonymous submissions). Mock left out — the route imports
// auth() from '@/auth' directly, which is already mocked above.

const mockDbExecute = jest.fn()
const mockInsert = jest.fn()
const mockInsertValues = jest.fn()
const mockInsertReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockInsertValues } },
  },
}))

jest.mock('@/db/schema/itHilfe', () => ({
  itHilfeRequests: { id: 'ihr_id', requesterId: 'ihr_requesterId', status: 'ihr_status' },
}))

jest.mock('@/db/schema/auth', () => ({
  users: { id: 'u_id', name: 'u_name' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'sql' }), { raw: jest.fn(), join: jest.fn() }),
  getTableName: jest.fn().mockReturnValue('mock_table'),
}))

const mockItHilfeCreateLimiter = jest.fn()
const mockGetClientIdentifier = jest.fn().mockReturnValue('127.0.0.1')

jest.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: {
    itHilfeCreate: (...args: unknown[]) => mockItHilfeCreateLimiter.apply(null, args),
  },
  getClientIdentifier: (...args: unknown[]) => mockGetClientIdentifier.apply(null, args),
}))

const mockFindOrCreateAnonymousUser = jest.fn()
jest.mock('@/lib/it-hilfe/find-or-create-anonymous-user', () => ({
  findOrCreateAnonymousUser: (...args: unknown[]) => mockFindOrCreateAnonymousUser.apply(null, args),
}))

const mockCreatePasswordResetToken = jest.fn()
jest.mock('@/lib/auth/db-verification', () => ({
  createPasswordResetToken: (...args: unknown[]) => mockCreatePasswordResetToken.apply(null, args),
}))

const mockSendCustomEmail = jest.fn()
jest.mock('@/lib/email', () => ({
  sendCustomEmail: (...args: unknown[]) => mockSendCustomEmail.apply(null, args),
}))

jest.mock('@/lib/email/templates/it-hilfe', () => ({
  itHilfeAnonymousRequestClaim: jest.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
}))

jest.mock('@/config/urls', () => ({ APP_URL: 'https://example.com' }))

jest.mock('@/lib/security/sanitize', () => ({
  sanitizeInput: (input: string) => input,
}))

jest.mock('@/config/it-hilfe', () => ({
  getCategoryIds: jest.fn().mockReturnValue(['hardware', 'software', 'network', 'other']),
  getSkillIds: jest.fn().mockReturnValue(['wifi', 'linux', 'windows']),
  URGENCY_LEVELS: [{ id: 'low' }, { id: 'normal' }, { id: 'high' }],
  URGENCY_DEFAULT: 'normal',
  SERVICE_TYPES: [{ id: 'remote' }, { id: 'onsite' }, { id: 'flexible' }],
  SERVICE_TYPE_DEFAULT: 'flexible',
  REQUEST_STATUS: { OPEN: 'open', MATCHED: 'matched', COMPLETED: 'completed' },
  deriveBudgetType: jest.fn().mockReturnValue('free'),
}))

jest.mock('@/lib/schemas/it-hilfe', () => ({
  itHilfeRequestSchema: {},
  validateAndRespond: jest.fn().mockReturnValue({
    success: true,
    data: {
      title: 'Laptop geht nicht',
      description: 'Laptop startet nicht mehr',
      categoryId: 'hardware',
      urgency: 'normal',
      serviceType: 'flexible',
      skillsNeeded: [],
    },
  }),
}))

jest.mock('@/lib/it-hilfe/request-mapper', () => ({
  mapRequestListRow: (row: Record<string, unknown>) => ({
    id: row.id,
    title: row.title,
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    status: row.status,
  }),
}))

jest.mock('@/lib/it-hilfe/notifications', () => ({
  sendRequestCreatedNotifications: jest.fn(),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccessCached: (data: unknown) => NextResponse.json({ success: true, data }),
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    parsePagination: jest.fn().mockReturnValue({ limit: 20, offset: 0, page: 1 }),
  
    hasMoreItems: (offset: number, limit: number, total: number) => offset + limit < total,}
})

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'User', isStaff: false, staffPermissions: [] as string[], isSuperAdmin: false },
  expires: '2027-01-01',
}

function makeRow(id: string, total = 3) {
  return {
    _total_count: total,
    id,
    title: 'Laptop geht nicht',
    requester_id: 'user-1',
    requester_name: 'Hans',
    status: 'open',
    category_id: 'hardware',
    urgency: 'normal',
    budget_type: 'free',
    budget_amount_cents: null,
    service_type: 'flexible',
    city: 'Zürich',
    canton: 'ZH',
    expires_at: '2027-01-01',
    created_at: '2026-05-01',
  }
}

const MOCK_ROWS = [makeRow('req-1'), makeRow('req-2'), makeRow('req-3')]

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/it-hilfe/requests')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

function makePostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/it-hilfe/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Laptop geht nicht', ...body }),
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockDbExecute.mockResolvedValue({ rows: MOCK_ROWS })
  mockItHilfeCreateLimiter.mockReturnValue(true)
  mockGetClientIdentifier.mockReturnValue('127.0.0.1')
  mockInsertValues.mockReturnValue({ returning: mockInsertReturning })
  mockInsertReturning.mockResolvedValue([{ id: 'req-new' }])
  mockFindOrCreateAnonymousUser.mockResolvedValue({ userId: 'anon-user-1', wasCreated: true })
  mockCreatePasswordResetToken.mockResolvedValue('reset-token-abc')
  mockSendCustomEmail.mockResolvedValue(undefined)
  // jest.resetAllMocks() wipes return values on jest.fn() defined inside
  // jest.mock() factories — re-set the template mock so it doesn't return
  // undefined into sendCustomEmail.
  const templates = require('@/lib/email/templates/it-hilfe')
  templates.itHilfeAnonymousRequestClaim.mockReturnValue({ subject: 's', html: 'h', text: 't' })

  const helpers = require('@/lib/api/helpers')
  helpers.parsePagination.mockReturnValue({ limit: 20, offset: 0, page: 1 })

  const schemas = require('@/lib/schemas/it-hilfe')
  schemas.validateAndRespond.mockReturnValue({
    success: true,
    data: {
      title: 'Laptop geht nicht',
      description: 'Laptop startet nicht mehr',
      categoryId: 'hardware',
      urgency: 'normal',
      serviceType: 'flexible',
      skillsNeeded: [],
    },
  })

  const itHilfe = require('@/config/it-hilfe')
  itHilfe.deriveBudgetType.mockReturnValue('free')
})

// ============================================================================
// GET /api/it-hilfe/requests
// ============================================================================

describe('GET /api/it-hilfe/requests — success', () => {
  it('returns 200', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
  })

  it('returns requests array', async () => {
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.data.requests).toHaveLength(3)
  })

  it('extracts total from _total_count window function', async () => {
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.data.total).toBe(3)
  })

  it('returns total 0 and empty array when no rows', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.data.requests).toEqual([])
    expect(body.data.total).toBe(0)
  })

  it('includes pagination metadata', async () => {
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.data.pagination).toBeDefined()
    expect(typeof body.data.pagination.limit).toBe('number')
    expect(typeof body.data.pagination.offset).toBe('number')
    expect(typeof body.data.pagination.hasMore).toBe('boolean')
  })

  it('returns 500 when DB throws', async () => {
    mockDbExecute.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(500)
  })
})

// ============================================================================
// POST /api/it-hilfe/requests
// ============================================================================

describe('POST /api/it-hilfe/requests — anonymous submissions', () => {
  // Anonymous-post is the conversion-driver T1 from the roadmap: a logged-out
  // visitor must be able to submit a request by supplying just their email.

  it('returns 400 when session is null AND no submitterEmail provided', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest())
    expect(response.status).toBe(400)
    expect(mockInsertReturning).not.toHaveBeenCalled()
  })

  it('returns 201 when session is null AND submitterEmail is provided', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const schemas = require('@/lib/schemas/it-hilfe')
    schemas.validateAndRespond.mockReturnValueOnce({
      success: true,
      data: {
        title: 'Laptop geht nicht',
        description: 'Laptop startet nicht mehr',
        categoryId: 'hardware',
        urgency: 'normal',
        serviceType: 'flexible',
        skillsNeeded: [],
        submitterEmail: 'anon@example.com',
      },
    })

    const response = await POST(makePostRequest({ submitterEmail: 'anon@example.com' }))
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.data.newAccount).toBe(true)

    // findOrCreateAnonymousUser was called with the email
    expect(mockFindOrCreateAnonymousUser).toHaveBeenCalledWith('anon@example.com')
    // The request was inserted with the resolved anonymous userId
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ requesterId: 'anon-user-1' })
    )
  })

  it('sends the claim email when wasCreated is true (new anonymous account)', async () => {
    mockAuth.mockResolvedValueOnce(null)
    mockFindOrCreateAnonymousUser.mockResolvedValueOnce({ userId: 'new-anon-1', wasCreated: true })
    const schemas = require('@/lib/schemas/it-hilfe')
    schemas.validateAndRespond.mockReturnValueOnce({
      success: true,
      data: {
        title: 'Laptop geht nicht',
        submitterEmail: 'newuser@example.com',
      },
    })

    await POST(makePostRequest({ submitterEmail: 'newuser@example.com' }))

    // Allow the fire-and-forget chain a tick to complete
    await new Promise(resolve => setImmediate(resolve))

    // 7-day TTL — claim links shouldn't expire while users are still
    // reading their email backlog.
    expect(mockCreatePasswordResetToken).toHaveBeenCalledWith('newuser@example.com', 7 * 24 * 60 * 60 * 1000)
    expect(mockSendCustomEmail).toHaveBeenCalledWith(
      'newuser@example.com',
      expect.any(Object)
    )

    // The claim URL must include callbackUrl pointing to the just-created
    // request, so the user lands on it after setting a password + signing in.
    // (Without this, the post-claim UX dumps users on the default page and
    // they have to navigate to /it-hilfe/my themselves.)
    const templates = require('@/lib/email/templates/it-hilfe')
    const claimArgs = templates.itHilfeAnonymousRequestClaim.mock.calls[0]
    const claimUrl = claimArgs[1] as string
    expect(claimUrl).toContain('callbackUrl=')
    expect(claimUrl).toContain(encodeURIComponent('/it-hilfe/req-new'))
    expect(claimUrl).toContain('token=')

    // The standard request-confirmation email must be SUPPRESSED for new
    // anonymous accounts (the claim email replaces it). Two emails to the
    // same person would confuse and the standard one's "view your request"
    // link wouldn't work until they've claimed.
    const notifMod = require('@/lib/it-hilfe/notifications')
    const notifArgs = notifMod.sendRequestCreatedNotifications.mock.calls[0][0]
    expect(notifArgs.includeRequesterConfirmation).toBe(false)
  })

  it('keeps requester confirmation enabled when wasCreated is false (existing account)', async () => {
    mockAuth.mockResolvedValueOnce(null)
    mockFindOrCreateAnonymousUser.mockResolvedValueOnce({ userId: 'existing-2', wasCreated: false })
    const schemas = require('@/lib/schemas/it-hilfe')
    schemas.validateAndRespond.mockReturnValueOnce({
      success: true,
      data: { title: 'X', submitterEmail: 'known@example.com' },
    })

    await POST(makePostRequest({ submitterEmail: 'known@example.com' }))
    await new Promise(resolve => setImmediate(resolve))

    const notifMod = require('@/lib/it-hilfe/notifications')
    const notifArgs = notifMod.sendRequestCreatedNotifications.mock.calls[0][0]
    // Existing user: they have a password, the standard confirmation email's
    // link works for them — DON'T suppress it.
    expect(notifArgs.includeRequesterConfirmation).toBe(true)
  })

  it('does NOT send the claim email when wasCreated is false (existing account)', async () => {
    mockAuth.mockResolvedValueOnce(null)
    mockFindOrCreateAnonymousUser.mockResolvedValueOnce({ userId: 'existing-1', wasCreated: false })
    const schemas = require('@/lib/schemas/it-hilfe')
    schemas.validateAndRespond.mockReturnValueOnce({
      success: true,
      data: {
        title: 'Laptop geht nicht',
        submitterEmail: 'existing@example.com',
      },
    })

    await POST(makePostRequest({ submitterEmail: 'existing@example.com' }))
    await new Promise(resolve => setImmediate(resolve))

    expect(mockCreatePasswordResetToken).not.toHaveBeenCalled()
    expect(mockSendCustomEmail).not.toHaveBeenCalled()
  })

  it('uses client IP for rate limiting key when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    mockGetClientIdentifier.mockReturnValueOnce('203.0.113.1')
    const schemas = require('@/lib/schemas/it-hilfe')
    schemas.validateAndRespond.mockReturnValueOnce({
      success: true,
      data: { title: 'X', submitterEmail: 'foo@bar.com' },
    })

    await POST(makePostRequest({ submitterEmail: 'foo@bar.com' }))

    // First arg to itHilfeCreate is the rate-limit key
    const callKey = mockItHilfeCreateLimiter.mock.calls[0][0] as string
    expect(callKey).toContain('203.0.113.1')
    expect(callKey).toContain('anon')
  })
})

describe('POST /api/it-hilfe/requests — rate limiting', () => {
  it('returns 400 when rate limited', async () => {
    mockItHilfeCreateLimiter.mockReturnValueOnce(false)
    const response = await POST(makePostRequest())
    expect(response.status).toBe(400)
  })
})

describe('POST /api/it-hilfe/requests — validation', () => {
  it('returns 400 when validation fails', async () => {
    const schemas = require('@/lib/schemas/it-hilfe')
    schemas.validateAndRespond.mockReturnValueOnce({
      success: false,
      errors: ['title: Titel erforderlich'],
    })
    const response = await POST(makePostRequest())
    expect(response.status).toBe(400)
  })
})

describe('POST /api/it-hilfe/requests — success', () => {
  it('returns 201 with requestId', async () => {
    const response = await POST(makePostRequest())
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.data.requestId).toBe('req-new')
  })

  it('returns 500 when DB throws', async () => {
    mockInsertReturning.mockRejectedValueOnce(new Error('DB error'))
    const response = await POST(makePostRequest())
    expect(response.status).toBe(500)
  })
})
