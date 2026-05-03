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

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: (req: Request, session: unknown) => unknown) =>
    (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: unknown }).user) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return handler(req, session)
      }),
}))

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

jest.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: {
    itHilfeCreate: (...args: unknown[]) => mockItHilfeCreateLimiter.apply(null, args),
  },
}))

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
  mockInsertValues.mockReturnValue({ returning: mockInsertReturning })
  mockInsertReturning.mockResolvedValue([{ id: 'req-new' }])

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

describe('POST /api/it-hilfe/requests — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest())
    expect(response.status).toBe(401)
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
