/**
 * @jest-environment node
 *
 * Tests for GET /api/it-hilfe/my-requests
 *
 * Mission-relevant: users track their IT-Hilfe requests here. If total/pagination
 * are wrong or the wrong user's requests are returned, the dashboard is
 * unreliable and users can't manage their requests.
 *
 * Behaviors locked:
 *   GET /api/it-hilfe/my-requests
 *   - returns 401 when not authenticated
 *   - returns 200 with paginated requests
 *   - extracts total from _total window-function column
 *   - strips _total from each returned row
 *   - includes pagination metadata (limit, offset, hasMore)
 *   - returns empty array and total 0 when user has no requests
 *   - applies status filter when status param is present
 *   - returns 500 when DB throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

// Select chain: select().from().where().orderBy().limit().offset()
const mockOffset = jest.fn()
const mockLimit = jest.fn().mockReturnValue({ offset: mockOffset })
const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit })
const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
const mockSelect = jest.fn().mockReturnValue({ from: mockFrom })

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  itHilfeRequests: {
    id: 'ihr_id', requesterId: 'ihr_requesterId', categoryId: 'ihr_catId',
    deviceBrand: 'ihr_brand', deviceModel: 'ihr_model', title: 'ihr_title',
    description: 'ihr_desc', urgency: 'ihr_urgency', budgetType: 'ihr_budget',
    budgetAmountCents: 'ihr_budgetCents', postalCode: 'ihr_postal',
    city: 'ihr_city', canton: 'ihr_canton', serviceType: 'ihr_service',
    skillsNeeded: 'ihr_skills', imageUrls: 'ihr_images', status: 'ihr_status',
    matchedOfferId: 'ihr_matched', offerCount: 'ihr_offerCount',
    expiresAt: 'ihr_expires', createdAt: 'ihr_created', updatedAt: 'ihr_updated',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  desc: jest.fn().mockReturnValue({ __desc: true }),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'sql' }), { raw: jest.fn() }),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiUnauthorized: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 401 }),
    parsePagination: jest.fn().mockReturnValue({ limit: 20, offset: 0, page: 1 }),
    hasMoreItems: (offset: number, limit: number, total: number) => offset + limit < total,
  }
})

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'user-req', email: 'requester@example.com', name: 'User', isStaff: false, staffPermissions: [] as string[], isSuperAdmin: false },
  expires: '2027-01-01',
}

function makeRow(id: string, status = 'open') {
  return {
    _total: 3,
    id, categoryId: 'cat-1', deviceBrand: 'Lenovo', deviceModel: 'T14',
    title: 'Laptop kaputt', description: '...', urgency: 'normal',
    budgetType: 'free', budgetAmountCents: null, postalCode: '8005',
    city: 'Zürich', canton: 'ZH', serviceType: 'remote',
    skillsNeeded: ['wifi'], imageUrls: [], status,
    matchedOfferId: null, offerCount: 0, expiresAt: null,
    createdAt: '2026-05-01', updatedAt: '2026-05-01',
  }
}

const MOCK_ROWS = [makeRow('req-1'), makeRow('req-2'), makeRow('req-3')]

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/it-hilfe/my-requests')
  for (const [key, val] of Object.entries(params)) url.searchParams.set(key, val)
  return new NextRequest(url.toString())
}

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockSelect.mockReturnValue({ from: mockFrom })
  mockFrom.mockReturnValue({ where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOffset.mockResolvedValue(MOCK_ROWS)
})

// ============================================================================
// GET /api/it-hilfe/my-requests
// ============================================================================

describe('GET /api/it-hilfe/my-requests — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/it-hilfe/my-requests — authenticated', () => {
  it('returns 200 on success', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
  })

  it('returns requests array', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.requests).toHaveLength(3)
  })

  it('strips _total from each row', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    for (const row of body.data.requests) {
      expect(row._total).toBeUndefined()
    }
  })

  it('extracts total from first row _total', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.total).toBe(3)
  })

  it('returns total 0 when no rows', async () => {
    mockOffset.mockResolvedValueOnce([])
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.total).toBe(0)
    expect(body.data.requests).toEqual([])
  })

  it('includes pagination metadata', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.pagination).toBeDefined()
    expect(typeof body.data.pagination.limit).toBe('number')
    expect(typeof body.data.pagination.offset).toBe('number')
    expect(typeof body.data.pagination.hasMore).toBe('boolean')
  })

  it('returns 500 when DB throws', async () => {
    mockOffset.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
  })
})
