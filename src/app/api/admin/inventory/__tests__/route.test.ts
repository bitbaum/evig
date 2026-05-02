/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/inventory
 *
 * Behaviors locked:
 *   GET /api/admin/inventory
 *   - returns 401 when not authenticated
 *   - returns 200 with products list and total
 *   - returns 200 with empty list when no products (skips profiles query)
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
const mockLeftJoin = jest.fn()
const mockInnerJoin = jest.fn()
const mockWhere = jest.fn()
const mockInnerJoinWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockOffset = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
  },
}))

jest.mock('@/db/schema', () => ({
  aiExtractedProducts: { id: 'aep_id', productName: 'aep_name', brand: 'aep_brand', model: 'aep_model', status: 'aep_status', createdAt: 'aep_createdAt', estimatedPriceChf: 'aep_price', condition: 'aep_condition', category: 'aep_category', subcategory: 'aep_subcategory', itemUuid: 'aep_itemUuid', kivitendoArticleNumber: 'aep_kiv', specifications: 'aep_specs' },
  inventoryItems: { id: 'ii_id', aiProductId: 'ii_aiProductId', location: 'ii_location', boxId: 'ii_boxId', quantityAvailable: 'ii_qty', marketplaceStatus: 'ii_mktStatus' },
  productCustomerProfiles: { productId: 'pcp_productId', profileId: 'pcp_profileId' },
  customerProfiles: { id: 'cp_id', slug: 'cp_slug' },
  productImages: { productId: 'pi_productId', filePath: 'pi_filePath', isPrimary: 'pi_isPrimary', isDeleted: 'pi_isDeleted' },
  marketplaceListings: { id: 'ml_id', inventoryItemId: 'ml_inventoryItemId' },
}))

jest.mock('drizzle-orm', () => ({
  and: (...args: unknown[]) => ({ __and: args }),
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  ilike: (a: unknown, b: unknown) => ({ __ilike: [a, b] }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  desc: (col: unknown) => ({ __desc: col }),
  inArray: (col: unknown, arr: unknown) => ({ __inArray: [col, arr] }),
}))

jest.mock('@/config/marketplace-status', () => ({
  MARKETPLACE_STATUS: { DRAFT: 'draft', PUBLISHED: 'published' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    parsePagination: jest.fn().mockReturnValue({ limit: 20, offset: 0 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

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

const MOCK_PRODUCT_ROWS = [
  { _total: 2, id: 'prod-1', product_name: 'ThinkPad', brand: 'Lenovo', model: 'X1', status: 'approved', created_at: '2026-01-01', item_uuid: 'uuid-1' },
  { _total: 2, id: 'prod-2', product_name: 'Latitude', brand: 'Dell', model: '5400', status: 'approved', created_at: '2026-01-02', item_uuid: 'uuid-2' },
]

const MOCK_PROFILE_ROWS = [
  { product_id: 'prod-1', slug: 'schule' },
]

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/inventory')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString(), { method: 'GET' })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Products query chain: select().from().leftJoin().where().orderBy().limit().offset()
  mockFrom.mockReturnValue({ leftJoin: mockLeftJoin, innerJoin: mockInnerJoin })
  mockLeftJoin.mockReturnValue({ where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOffset.mockResolvedValue(MOCK_PRODUCT_ROWS)

  // Profiles query chain: select().from().innerJoin().where()
  mockInnerJoin.mockReturnValue({ where: mockInnerJoinWhere })
  mockInnerJoinWhere.mockResolvedValue(MOCK_PROFILE_ROWS)

  const helpers = require('@/lib/api/helpers')
  helpers.parsePagination.mockReturnValue({ limit: 20, offset: 0 })
})

// ============================================================================
// GET /api/admin/inventory
// ============================================================================

describe('GET /api/admin/inventory — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/inventory — authenticated', () => {
  it('returns 200 with products list and total', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.products).toHaveLength(2)
    expect(body.data.total).toBe(2)
  })

  it('attaches customer profiles to matching products', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.products[0].customer_profiles).toEqual(['schule'])
    expect(body.data.products[1].customer_profiles).toEqual([])
  })

  it('returns 200 with empty list when no products (skips profiles query)', async () => {
    mockOffset.mockResolvedValueOnce([])
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.products).toHaveLength(0)
    expect(body.data.total).toBe(0)
    expect(mockInnerJoinWhere).not.toHaveBeenCalled()
  })

  it('returns 500 when DB throws', async () => {
    mockOffset.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
  })
})
