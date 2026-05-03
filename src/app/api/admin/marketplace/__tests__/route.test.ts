/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/marketplace
 *
 * Behaviors locked:
 *   GET /api/admin/marketplace
 *   - returns 401 when not authenticated
 *   - returns 400 when query is invalid
 *   - returns 200 with items and pagination
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
const mockInnerJoin = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockOffset = jest.fn()
const mockValidateQuery = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
  },
}))

jest.mock('@/db/schema', () => ({
  listings: {
    id: 'l_id', title: 'l_title', priceChf: 'l_price', category: 'l_category',
    condition: 'l_condition', status: 'l_status', isRevampit: 'l_isRevampit',
    verifiedAt: 'l_verifiedAt', adminNotes: 'l_adminNotes', createdAt: 'l_createdAt',
    sellerId: 'l_sellerId',
  },
  listingReports: { id: 'lr_id', listingId: 'lr_listingId', status: 'lr_status' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm/pg-core', () => ({
  alias: (_table: unknown, name: string) => ({
    id: `${name}_id`,
    name: `${name}_name`,
    email: `${name}_email`,
  }),
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  ilike: (a: unknown, b: unknown) => ({ __ilike: [a, b] }),
  isNotNull: (col: unknown) => ({ __isNotNull: col }),
  isNull: (col: unknown) => ({ __isNull: col }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: { LISTING_REPORTS: 'listing_reports' },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}))

jest.mock('@/config/report-status', () => ({
  REPORT_STATUS: { PENDING: 'pending' },
}))

jest.mock('@/config/marketplace', () => ({
  MARKETPLACE_SELLER_TYPE: { REVAMPIT: 'revampit', COMMUNITY: 'community' },
}))

jest.mock('@/lib/schemas', () => ({
  validateQuery: (...args: unknown[]) => mockValidateQuery.apply(null, args),
  AdminListingsQuerySchema: {},
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
  
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
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_ROWS = [
  { id: 'lst-1', title: 'Laptop', status: 'active', seller_name: 'Hans', seller_email: 'hans@example.com' },
]

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/marketplace')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString(), { method: 'GET' })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Parallel queries: items (innerJoin→where→orderBy→limit→offset) + count (innerJoin→where)
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin })
  mockInnerJoin.mockReturnValue({ where: mockWhere })
  mockWhere
    .mockReturnValueOnce({ orderBy: mockOrderBy })   // items query
    .mockResolvedValueOnce([{ total: '1' }])           // count query
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOffset.mockResolvedValue(MOCK_ROWS)

  mockValidateQuery.mockReturnValue({
    success: true,
    data: { status: 'all', limit: 20, offset: 0 },
  })
})

// ============================================================================
// GET /api/admin/marketplace
// ============================================================================

describe('GET /api/admin/marketplace — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/marketplace — validation', () => {
  it('returns 400 when query is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateQuery.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Abfrage' }, { status: 400 }),
    })
    const response = await GET(makeRequest())
    expect(response.status).toBe(400)
  })
})

describe('GET /api/admin/marketplace — authenticated', () => {
  it('returns 200 with items and pagination', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.items).toHaveLength(1)
    expect(body.data.pagination.total).toBe(1)
    expect(body.data.pagination.limit).toBe(20)
  })

  it('returns 500 when DB throws', async () => {
    mockOffset.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
  })
})
