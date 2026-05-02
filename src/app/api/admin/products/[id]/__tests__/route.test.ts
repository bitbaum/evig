/**
 * @jest-environment node
 *
 * Tests for GET/PUT/DELETE /api/admin/products/[id]
 *
 * Behaviors locked:
 *   GET /api/admin/products/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when product not found
 *   - returns 200 with product details
 *
 *   PUT /api/admin/products/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 200 on success
 *
 *   DELETE /api/admin/products/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when product not found
 *   - returns 200 on success
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
    return (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params
          ? { params: await context.params }
          : undefined
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, resolvedContext)
      })
  },
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockDelete = jest.fn()
const mockDeleteWhere = jest.fn()
const mockValidateBody = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    delete: (...args: unknown[]) => { mockDelete(...args); return { where: mockDeleteWhere } },
  },
}))

jest.mock('@/db/schema', () => ({
  aiExtractedProducts: {
    id: 'aep_id', itemUuid: 'aep_itemUuid', productName: 'aep_productName', brand: 'aep_brand',
    shortDescription: 'aep_shortDesc', specifications: 'aep_specs', estimatedPriceChf: 'aep_price',
    condition: 'aep_condition', dimensions: 'aep_dims', weightGrams: 'aep_weight',
    category: 'aep_category', subcategory: 'aep_subcat', status: 'aep_status',
    createdAt: 'aep_createdAt', updatedAt: 'aep_updatedAt',
  },
  inventoryItems: {
    id: 'ii_id', aiProductId: 'ii_aiProductId',
    quantityAvailable: 'ii_qty', marketplaceStatus: 'ii_mktStatus',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  AdminUpdateProductSchema: {},
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_PRODUCT = { id: 'prod-1', product_name: 'ThinkPad', brand: 'Lenovo', status: 'active' }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/products/prod-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(id = 'prod-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockFrom.mockReturnValue({ leftJoin: mockLeftJoin })
  mockLeftJoin.mockReturnValue({ where: mockWhere })
  mockWhere.mockResolvedValue([MOCK_PRODUCT])

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)

  // DELETE: two calls — first ignores result, second checks rowCount
  mockDeleteWhere
    .mockResolvedValueOnce(undefined)          // delete inventoryItems (ignored)
    .mockResolvedValueOnce({ rowCount: 1 })    // delete aiExtractedProducts

  mockValidateBody.mockReturnValue({ success: true, data: { brand: 'Apple' } })
})

// ============================================================================
// GET /api/admin/products/[id]
// ============================================================================

describe('GET /api/admin/products/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/products/[id] — authenticated', () => {
  it('returns 404 when product not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 with product details', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.product.id).toBe('prod-1')
  })
})

// ============================================================================
// PUT /api/admin/products/[id]
// ============================================================================

describe('PUT /api/admin/products/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PUT(makeRequest('PUT', { brand: 'Apple' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PUT /api/admin/products/[id] — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await PUT(makeRequest('PUT', {}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PUT /api/admin/products/[id] — success', () => {
  it('returns 200 on success', async () => {
    const response = await PUT(makeRequest('PUT', { brand: 'Apple' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.productId).toBe('prod-1')
  })
})

// ============================================================================
// DELETE /api/admin/products/[id]
// ============================================================================

describe('DELETE /api/admin/products/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/admin/products/[id] — authenticated', () => {
  it('returns 404 when product not found', async () => {
    mockDeleteWhere.mockReset()
    mockDeleteWhere
      .mockResolvedValueOnce(undefined)          // delete inventoryItems
      .mockResolvedValueOnce({ rowCount: 0 })    // delete aiExtractedProducts → not found
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 on success', async () => {
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.deleted).toBe(true)
  })
})
