/**
 * @jest-environment node
 *
 * Tests for GET/POST /api/admin/products
 *
 * Behaviors locked:
 *   GET /api/admin/products
 *   - returns 401 when not authenticated
 *   - returns 200 with products and pagination
 *   - returns 500 when DB throws
 *
 *   POST /api/admin/products
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 201 on success
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
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockOffset = jest.fn()
const mockTransaction = jest.fn()
const mockValidateBody = jest.fn()
const mockCreateErfassungProduct = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    transaction: (...args: unknown[]) => mockTransaction.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  aiExtractedProducts: {
    id: 'aep_id', productName: 'aep_productName', brand: 'aep_brand',
    shortDescription: 'aep_shortDesc', estimatedPriceChf: 'aep_price',
    condition: 'aep_condition', category: 'aep_category', subcategory: 'aep_subcat',
    status: 'aep_status', createdAt: 'aep_createdAt', itemUuid: 'aep_itemUuid',
  },
  inventoryItems: {
    id: 'ii_id', aiProductId: 'ii_aiProductId',
    quantityAvailable: 'ii_qty', marketplaceStatus: 'ii_mktStatus',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  ilike: (a: unknown, b: unknown) => ({ __ilike: [a, b] }),
  desc: (col: unknown) => ({ __desc: col }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/marketplace-status', () => ({
  MARKETPLACE_STATUS: { PUBLISHED: 'published', DRAFT: 'draft' },
}))

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  AdminCreateProductSchema: {},
}))

jest.mock('@/lib/erfassung/create-product', () => ({
  createErfassungProduct: (...args: unknown[]) => mockCreateErfassungProduct.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    parsePagination: jest.fn().mockReturnValue({ limit: 50, offset: 0 }),
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

const MOCK_ROWS = [
  { _total: 1, id: 'prod-1', product_name: 'ThinkPad', brand: 'Lenovo', status: 'active' },
]

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/products')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString(), { method: 'GET' })
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockFrom.mockReturnValue({ leftJoin: mockLeftJoin })
  mockLeftJoin.mockReturnValue({ where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOffset.mockResolvedValue(MOCK_ROWS)

  mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb({}))
  mockCreateErfassungProduct.mockResolvedValue({ productId: 'new-prod-1' })

  mockValidateBody.mockReturnValue({ success: true, data: { title: 'New Product', brand: 'Apple' } })

  const helpers = require('@/lib/api/helpers')
  helpers.parsePagination.mockReturnValue({ limit: 50, offset: 0 })
})

// ============================================================================
// GET /api/admin/products
// ============================================================================

describe('GET /api/admin/products — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/products — authenticated', () => {
  it('returns 200 with products and pagination', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.products).toHaveLength(1)
    expect(body.data.count).toBe(1)
    expect(body.data.limit).toBe(50)
  })

  it('returns 500 when DB throws', async () => {
    mockOffset.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(500)
  })
})

// ============================================================================
// POST /api/admin/products
// ============================================================================

describe('POST /api/admin/products — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest({ title: 'New' }))
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/products — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await POST(makePostRequest({}))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/admin/products — success', () => {
  it('returns 201 on success', async () => {
    const response = await POST(makePostRequest({ title: 'New Product' }))
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.data.id).toBe('new-prod-1')
  })
})
