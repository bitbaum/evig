/**
 * @jest-environment node
 *
 * Tests for GET /api/it-hilfe/helper/my-offers
 *
 * Mission-relevant: helpers track their submitted offers here. The window
 * function total and pagination metadata must be accurate so helpers know
 * whether there are more offers to load.
 *
 * Behaviors locked:
 *   GET /api/it-hilfe/helper/my-offers
 *   - returns 401 when not authenticated
 *   - returns 200 with offers array
 *   - extracts total from _total_count window function column
 *   - returns total 0 and empty array when no offers
 *   - includes pagination metadata (limit, offset, hasMore)
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

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  itHilfeOffers: { id: 'iho_id', helperId: 'iho_helperId', requestId: 'iho_requestId', createdAt: 'iho_createdAt' },
  itHilfeRequests: { id: 'ihr_id', title: 'ihr_title', createdAt: 'ihr_createdAt' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'sql' }), { raw: jest.fn(), join: jest.fn() }),
  getTableName: jest.fn().mockReturnValue('mock_table'),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    parsePagination: jest.fn().mockReturnValue({ limit: 20, offset: 0, page: 1 }),
  
    hasMoreItems: (offset: number, limit: number, total: number) => offset + limit < total,}
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
  user: { id: 'helper-1', email: 'helper@example.com', name: 'Helper', isStaff: false, staffPermissions: [] as string[], isSuperAdmin: false },
  expires: '2027-01-01',
}

function makeRow(offerId: string, total = 2) {
  return {
    _total_count: total,
    offer_id: offerId,
    offer_status: 'pending',
    offer_message: 'I can help',
    proposed_compensation: 'free',
    estimated_time: '2h',
    relevant_skills: ['wifi', 'linux'],
    offer_created_at: '2026-05-01',
    request_id: 'req-1',
    request_title: 'Laptop hilfe',
    category_id: 'cat-1',
    urgency: 'normal',
    budget_tier: 'free',
    city: 'Zürich',
    canton: 'ZH',
    request_status: 'open',
    request_created_at: '2026-04-01',
  }
}

const MOCK_ROWS = [makeRow('offer-1'), makeRow('offer-2')]

function makeRequest() {
  return new NextRequest('http://localhost/api/it-hilfe/helper/my-offers')
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockDbExecute.mockResolvedValue({ rows: MOCK_ROWS })

  const helpers = require('@/lib/api/helpers')
  helpers.parsePagination.mockReturnValue({ limit: 20, offset: 0, page: 1 })
})

// ============================================================================
// GET /api/it-hilfe/helper/my-offers
// ============================================================================

describe('GET /api/it-hilfe/helper/my-offers — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/it-hilfe/helper/my-offers — authenticated', () => {
  it('returns 200 on success', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
  })

  it('returns offers array', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.offers).toHaveLength(2)
  })

  it('extracts total from _total_count window function', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.total).toBe(2)
  })

  it('returns total 0 and empty array when no offers', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.offers).toEqual([])
    expect(body.data.total).toBe(0)
  })

  it('includes pagination metadata', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.pagination).toBeDefined()
    expect(typeof body.data.pagination.limit).toBe('number')
    expect(typeof body.data.pagination.offset).toBe('number')
    expect(typeof body.data.pagination.hasMore).toBe('boolean')
  })

  it('maps each row to offer with nested request', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    const offer = body.data.offers[0]
    expect(offer.request).toBeDefined()
    expect(offer.request.title).toBe('Laptop hilfe')
  })

  it('returns 500 when DB throws', async () => {
    mockDbExecute.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
  })
})
