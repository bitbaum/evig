/**
 * @jest-environment node
 *
 * Tests for GET/POST /api/admin/donations
 *
 * Mission-relevant: donation list + creation. GET uses a `_total` window
 * function. POST branches on donation_type (monetary vs device).
 * `alias` is called at module level — must be a static mock.
 *
 * Behaviors locked:
 *   GET /api/admin/donations
 *   - returns 401 when not authenticated
 *   - returns 400 when query params invalid
 *   - returns 200 with paginated donations
 *   - returns 500 when DB throws
 *
 *   POST /api/admin/donations
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 201 for monetary donation
 *   - returns 201 for device donation
 *   - returns 500 when DB throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()
const mockGetQuerySafeParse = jest.fn()
const mockCreateSafeParse = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler
    return (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return (handler as (r: Request, s: unknown) => unknown)(req, session)
      })
  },
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockOffset = jest.fn()
const mockInsert = jest.fn()
const mockInsertValues = jest.fn()
const mockInsertReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockInsertValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  donations: { id: 'd_id', userId: 'd_userId', status: 'd_status', donationType: 'd_donationType', amountCents: 'd_amountCents', currency: 'd_currency', paymentMethod: 'd_paymentMethod', paymentReference: 'd_paymentReference', paymentDate: 'd_paymentDate', isRecurring: 'd_isRecurring', recurringFrequency: 'd_recurringFrequency', deviceCategory: 'd_deviceCategory', deviceDescription: 'd_deviceDescription', deviceBrand: 'd_deviceBrand', deviceModel: 'd_deviceModel', deviceCondition: 'd_deviceCondition', deviceAgeYears: 'd_deviceAgeYears', estimatedValueCents: 'd_estimatedValueCents', donorName: 'd_donorName', donorEmail: 'd_donorEmail', donorAddress: 'd_donorAddress', recordedBy: 'd_recordedBy', receiptRequested: 'd_receiptRequested', receiptSent: 'd_receiptSent', receiptSentAt: 'd_receiptSentAt', thankYouSent: 'd_thankYouSent', thankYouSentAt: 'd_thankYouSentAt', notes: 'd_notes', createdAt: 'd_createdAt', updatedAt: 'd_updatedAt' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

// alias is called at module level — must be static (not jest.fn())
jest.mock('drizzle-orm/pg-core', () => ({
  alias: (_table: unknown, name: string) => ({ id: `${name}_id`, name: `${name}_name`, email: `${name}_email` }),
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  gte: jest.fn().mockReturnValue({ __gte: true }),
  lte: jest.fn().mockReturnValue({ __lte: true }),
  desc: jest.fn().mockReturnValue({ __desc: true }),
  asc: jest.fn().mockReturnValue({ __asc: true }),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'count(*)' }), { raw: jest.fn(), join: jest.fn() }),
}))

jest.mock('@/lib/schemas/donations', () => ({
  GetDonationsQuerySchema: {
    safeParse: (...args: unknown[]) => mockGetQuerySafeParse.apply(null, args),
  },
  CreateDonationSchema: {
    safeParse: (...args: unknown[]) => mockCreateSafeParse.apply(null, args),
  },
}))

jest.mock('@/config/donations', () => ({
  DONATION_TYPES: { MONETARY: 'money', DEVICE: 'device' },
  DONATION_STATUSES: { RECORDED: 'recorded', ARCHIVED: 'archived' },
  getEstimatedValue: jest.fn().mockReturnValue(5000),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    hasMoreItems: (offset: number, limit: number, total: number) => offset + limit < total,
  }
})

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
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_QUERY_DATA = { donation_type: undefined, status: undefined, user_id: undefined, from_date: undefined, to_date: undefined, limit: 20, offset: 0, sort_by: 'created_at', sort_order: 'desc' }

const MOCK_DONATION_ROW = { _total: 2, id: 'don-1', user_name: 'Hans', donation_type: 'money', amount_cents: 5000, status: 'recorded' }
const MOCK_ROWS = [MOCK_DONATION_ROW, { ...MOCK_DONATION_ROW, id: 'don-2' }]

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/donations')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/donations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockFrom.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere, orderBy: mockOrderBy })
  mockLeftJoin.mockReturnValue({ where: mockWhere, leftJoin: mockLeftJoin, orderBy: mockOrderBy })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOffset.mockResolvedValue(MOCK_ROWS)

  mockInsertValues.mockReturnValue({ returning: mockInsertReturning })
  mockInsertReturning.mockResolvedValue([{ id: 'don-new' }])

  mockGetQuerySafeParse.mockReturnValue({ success: true, data: MOCK_QUERY_DATA })
  mockCreateSafeParse.mockReturnValue({
    success: true,
    data: { donation_type: 'money', amount_cents: 5000, currency: 'CHF', is_recurring: false, receipt_requested: false },
  })
})

// ============================================================================
// GET /api/admin/donations
// ============================================================================

describe('GET /api/admin/donations — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/donations — validation', () => {
  it('returns 400 when query params invalid', async () => {
    mockGetQuerySafeParse.mockReturnValueOnce({
      success: false,
      error: { flatten: () => ({ fieldErrors: {} }) },
    })
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(400)
  })
})

describe('GET /api/admin/donations — success', () => {
  it('returns 200 with paginated donations', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.items).toHaveLength(2)
    expect(body.data.pagination.total).toBe(2)
  })

  it('returns 500 when DB throws', async () => {
    mockOffset.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(500)
  })
})

// ============================================================================
// POST /api/admin/donations
// ============================================================================

describe('POST /api/admin/donations — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest({ donation_type: 'money' }))
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/donations — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockCreateSafeParse.mockReturnValueOnce({
      success: false,
      error: { flatten: () => ({ fieldErrors: {} }) },
    })
    const response = await POST(makePostRequest({}))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/admin/donations — success', () => {
  it('returns 201 for monetary donation', async () => {
    const response = await POST(makePostRequest({ donation_type: 'money', amount_cents: 5000, currency: 'CHF' }))
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.data.id).toBe('don-new')
  })

  it('returns 201 for device donation', async () => {
    mockCreateSafeParse.mockReturnValueOnce({
      success: true,
      data: { donation_type: 'device', device_category: 'laptop', is_recurring: false, receipt_requested: false },
    })
    const response = await POST(makePostRequest({ donation_type: 'device', device_category: 'laptop' }))
    expect(response.status).toBe(201)
  })

  it('returns 500 when DB throws', async () => {
    mockInsertReturning.mockRejectedValueOnce(new Error('DB error'))
    const response = await POST(makePostRequest({ donation_type: 'money' }))
    expect(response.status).toBe(500)
  })
})
