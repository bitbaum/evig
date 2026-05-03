/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/it-hilfe
 *
 * Behaviors locked:
 *   GET /api/admin/it-hilfe
 *   - returns 401 when not authenticated
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

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
  },
}))

jest.mock('@/db/schema', () => ({
  itHilfeRequests: { id: 'r_id', title: 'r_title', categoryId: 'r_catId', urgency: 'r_urgency', status: 'r_status', postalCode: 'r_postalCode', city: 'r_city', canton: 'r_canton', budgetAmountCents: 'r_budget', budgetType: 'r_budgetType', offerCount: 'r_offerCount', adminNotes: 'r_adminNotes', createdAt: 'r_createdAt', updatedAt: 'r_updatedAt', requesterId: 'r_requesterId', description: 'r_desc' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  ilike: (a: unknown, b: unknown) => ({ __ilike: [a, b] }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  desc: (col: unknown) => ({ __desc: col }),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    parsePagination: jest.fn().mockReturnValue({ limit: 20, offset: 0 }),
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
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_ROWS = [
  { id: 'req-1', title: 'Hilfe mit Laptop', status: 'open', requester_name: 'Hans', requester_email: 'hans@example.com' },
]

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/it-hilfe')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString(), { method: 'GET' })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Two parallel queries share the same mock chain
  // Items query: from().innerJoin().where().orderBy().limit().offset()
  // Count query: from().innerJoin().where()  -- terminal is where (second call)
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin })
  mockInnerJoin.mockReturnValue({ where: mockWhere })
  // First where call (items): returns chain
  // Second where call (count): resolves to count row
  mockWhere
    .mockReturnValueOnce({ orderBy: mockOrderBy })     // items query
    .mockResolvedValueOnce([{ total: '1' }])            // count query
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOffset.mockResolvedValue(MOCK_ROWS)

  const helpers = require('@/lib/api/helpers')
  helpers.parsePagination.mockReturnValue({ limit: 20, offset: 0 })
})

// ============================================================================
// GET /api/admin/it-hilfe
// ============================================================================

describe('GET /api/admin/it-hilfe — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/it-hilfe — authenticated', () => {
  it('returns 200 with items and pagination', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.items).toHaveLength(1)
    expect(body.data.pagination.limit).toBe(20)
  })

  it('returns 500 when DB throws', async () => {
    mockOffset.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
  })
})
