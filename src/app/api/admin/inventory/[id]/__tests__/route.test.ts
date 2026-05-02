/**
 * @jest-environment node
 *
 * Tests for GET/DELETE/PUT/PATCH /api/admin/inventory/[id]
 *
 * Behaviors locked:
 *   GET /api/admin/inventory/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when product not found
 *   - returns 200 with product data
 *
 *   DELETE /api/admin/inventory/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when product not found
 *   - returns 200 on success
 *
 *   PUT /api/admin/inventory/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 400 when no valid fields to update
 *   - returns 200 on success
 *
 *   PATCH /api/admin/inventory/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 200 and calls publishProduct when marketplace_status is published
 *   - returns 200 and calls unpublishProduct otherwise
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

// Drizzle select chain
const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockLeftJoin = jest.fn()
const mockInnerJoin = jest.fn()
const mockLeftJoinWhere = jest.fn()    // terminal: after leftJoin
const mockInnerJoinWhere = jest.fn()   // terminal: after innerJoin
const mockSelectWhere = jest.fn()      // intermediate/terminal for no-join selects
const mockSelectWhereLimit = jest.fn() // terminal: after where in image query

// Drizzle delete chain
const mockDelete = jest.fn()
const mockDeleteWhere = jest.fn()
const mockDeleteReturning = jest.fn()

// Drizzle update chain
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockUpdateReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    delete: (...args: unknown[]) => { mockDelete(...args); return { where: mockDeleteWhere } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  aiExtractedProducts: { id: 'aep_id', productName: 'aep_name', brand: 'aep_brand', itemUuid: 'aep_itemUuid', shortDescription: 'aep_shortDesc', specifications: 'aep_specs', estimatedPriceChf: 'aep_price', condition: 'aep_condition', dimensions: 'aep_dims', weightGrams: 'aep_weight', category: 'aep_category', subcategory: 'aep_subcategory', createdAt: 'aep_createdAt', status: 'aep_status', updatedAt: 'aep_updatedAt' },
  inventoryItems: { id: 'ii_id', aiProductId: 'ii_aiProductId', location: 'ii_location', boxId: 'ii_boxId', quantityAvailable: 'ii_qty', marketplaceStatus: 'ii_mktStatus', updatedAt: 'ii_updatedAt' },
  productCustomerProfiles: { productId: 'pcp_productId', profileId: 'pcp_profileId' },
  customerProfiles: { id: 'cp_id', slug: 'cp_slug' },
  productImages: { productId: 'pi_productId', filePath: 'pi_filePath', isPrimary: 'pi_isPrimary', id: 'pi_id' },
  marketplaceListings: { id: 'ml_id', inventoryItemId: 'ml_inventoryItemId' },
}))

jest.mock('drizzle-orm', () => ({
  and: (...args: unknown[]) => ({ __and: args }),
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  inArray: (col: unknown, arr: unknown) => ({ __inArray: [col, arr] }),
}))

jest.mock('@/config/intake-status', () => ({
  INTAKE_STATUS: { PUBLISHED: 'published', DRAFT: 'draft' },
}))

const mockPublishProduct = jest.fn()
const mockUnpublishProduct = jest.fn()
const mockUpdateProductImage = jest.fn()

jest.mock('@/lib/admin/inventory-actions', () => ({
  publishProduct: (...args: unknown[]) => mockPublishProduct.apply(null, args),
  unpublishProduct: (...args: unknown[]) => mockUnpublishProduct.apply(null, args),
  updateProductImage: (...args: unknown[]) => mockUpdateProductImage.apply(null, args),
}))

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  InventoryUpdateSchema: {},
  InventoryPatchSchema: {},
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
import { GET, DELETE, PUT, PATCH } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_PRODUCT = { id: 'prod-1', product_name: 'ThinkPad', brand: 'Lenovo', item_uuid: 'uuid-1', location: null, box_id: null, quantity_available: 1 }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/inventory/prod-1', {
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

  // SELECT chain:
  // Query 1 (leftJoin path): from → leftJoin → where (terminal)
  // Query 2 (innerJoin path): from → innerJoin → where (terminal)
  // Query 3 (no join): from → where → limit (terminal)
  mockFrom.mockReturnValue({
    leftJoin: mockLeftJoin,
    innerJoin: mockInnerJoin,
    where: mockSelectWhere,
  })
  mockLeftJoin.mockReturnValue({ where: mockLeftJoinWhere })
  mockLeftJoinWhere.mockResolvedValue([MOCK_PRODUCT])
  mockInnerJoin.mockReturnValue({ where: mockInnerJoinWhere })
  mockInnerJoinWhere.mockResolvedValue([])
  mockSelectWhere.mockReturnValue({ limit: mockSelectWhereLimit })
  mockSelectWhereLimit.mockResolvedValue([])

  // DELETE chain:
  // db.delete(x).where(...) → returns { returning: fn } (awaiting as plain object = fine when result ignored)
  // db.delete(aiExtractedProducts).where(...).returning() → the final delete
  mockDeleteWhere.mockReturnValue({ returning: mockDeleteReturning })
  mockDeleteReturning.mockResolvedValue([{ id: 'prod-1', itemUuid: 'uuid-1' }])

  // UPDATE chain:
  // db.update(x).set(...).where(...) → returns { returning: fn }
  // db.update(aiExtractedProducts).set(...).where(...).returning() → returns updated product
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning })
  mockUpdateReturning.mockResolvedValue([MOCK_PRODUCT])

  // validateBody default (used by PATCH)
  mockValidateBody.mockReturnValue({
    success: true,
    data: { marketplace_status: 'published' },
  })

  mockPublishProduct.mockResolvedValue(undefined)
  mockUnpublishProduct.mockResolvedValue(undefined)
  mockUpdateProductImage.mockResolvedValue('https://example.com/image.jpg')
})

// ============================================================================
// GET /api/admin/inventory/[id]
// ============================================================================

describe('GET /api/admin/inventory/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/inventory/[id] — authenticated', () => {
  it('returns 404 when product not found', async () => {
    mockLeftJoinWhere.mockResolvedValueOnce([])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 with product data', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.product.id).toBe('prod-1')
    expect(body.data.product.customer_profiles).toEqual([])
    expect(body.data.product.image_url).toBeNull()
  })
})

// ============================================================================
// DELETE /api/admin/inventory/[id]
// ============================================================================

describe('DELETE /api/admin/inventory/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/admin/inventory/[id] — authenticated', () => {
  it('returns 404 when product not found', async () => {
    mockDeleteReturning.mockResolvedValueOnce([])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 on success', async () => {
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.deleted.id).toBe('prod-1')
  })
})

// ============================================================================
// PUT /api/admin/inventory/[id]
// ============================================================================

describe('PUT /api/admin/inventory/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PUT(makeRequest('PUT', { product_name: 'New Name' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PUT /api/admin/inventory/[id] — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await PUT(makeRequest('PUT', {}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when no valid fields to update', async () => {
    mockValidateBody.mockReturnValueOnce({ success: true, data: {} })
    const response = await PUT(makeRequest('PUT', {}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PUT /api/admin/inventory/[id] — success', () => {
  it('returns 200 on success', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { product_name: 'Updated Name' },
    })
    const response = await PUT(makeRequest('PUT', { product_name: 'Updated Name' }), makeContext())
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// PATCH /api/admin/inventory/[id]
// ============================================================================

describe('PATCH /api/admin/inventory/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest('PATCH', { marketplace_status: 'published' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/admin/inventory/[id] — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await PATCH(makeRequest('PATCH', {}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/admin/inventory/[id] — success', () => {
  it('returns 200 and calls publishProduct when marketplace_status is published', async () => {
    const response = await PATCH(makeRequest('PATCH', { marketplace_status: 'published' }), makeContext())
    expect(response.status).toBe(200)
    expect(mockPublishProduct).toHaveBeenCalledWith('prod-1', 'admin-1')
  })

  it('returns 200 and calls unpublishProduct when marketplace_status is not published', async () => {
    mockValidateBody.mockReturnValueOnce({ success: true, data: { marketplace_status: 'draft' } })
    const response = await PATCH(makeRequest('PATCH', { marketplace_status: 'draft' }), makeContext())
    expect(response.status).toBe(200)
    expect(mockUnpublishProduct).toHaveBeenCalledWith('prod-1', 'admin-1')
  })
})
