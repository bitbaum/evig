/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/marketplace/stats
 *
 * Behaviors locked:
 *   GET /api/admin/marketplace/stats
 *   - returns 401 when not authenticated
 *   - returns 200 with stats breakdown
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

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
  },
}))

jest.mock('@/db/schema', () => ({
  listings: {
    id: 'l_id', status: 'l_status', verifiedAt: 'l_verifiedAt', isRevampit: 'l_isRevampit',
  },
  listingReports: { status: 'lr_status' },
  marketplaceOrders: { status: 'mo_status', amountChf: 'mo_amountChf' },
}))

jest.mock('drizzle-orm', () => ({
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: { LISTING_REPORTS: 'listing_reports', MARKETPLACE_ORDERS: 'marketplace_orders' },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}))

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { ACTIVE: 'active', SOLD: 'sold', DRAFT: 'draft', RESERVED: 'reserved', REMOVED: 'removed' },
  ORDER_STATUS: { PAID: 'paid', SHIPPED: 'shipped', DELIVERED: 'delivered', COMPLETED: 'completed' },
}))

jest.mock('@/config/report-status', () => ({
  REPORT_STATUS: { PENDING: 'pending' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
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

const MOCK_ROW = {
  total: '20', active: '8', sold: '5', draft: '3', reserved: '2', removed: '2',
  verified: '6', unverified: '2', revampit: '10', community: '10',
  openReports: '3', totalOrders: '7', revenueCents: '450000',
}

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/marketplace/stats', { method: 'GET' })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  // select().from() — terminal; from resolves directly
  mockFrom.mockResolvedValue([MOCK_ROW])
})

// ============================================================================
// GET /api/admin/marketplace/stats
// ============================================================================

describe('GET /api/admin/marketplace/stats — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/marketplace/stats — authenticated', () => {
  it('returns 200 with stats breakdown', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.total).toBe(20)
    expect(body.data.byStatus.active).toBe(8)
    expect(body.data.verified).toBe(6)
    expect(body.data.openReports).toBe(3)
    expect(body.data.revenueCents).toBe(450000)
  })

  it('returns 500 when DB throws', async () => {
    mockFrom.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
  })
})
