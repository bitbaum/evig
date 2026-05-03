/**
 * @jest-environment node
 *
 * Tests for GET /api/shop/inventory/[id] (public)
 *
 * Behaviors locked:
 *   GET - 404 (product not found), 404 (not published), 200 with product detail
 */

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockInnerJoin = jest.fn()
const mockOrderBy = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  aiExtractedProducts: {
    id: 'aep_id',
    itemUuid: 'aep_itemUuid',
    productName: 'aep_productName',
    brand: 'aep_brand',
    shortDescription: 'aep_shortDescription',
    specifications: 'aep_specifications',
    estimatedPriceChf: 'aep_estimatedPriceChf',
    condition: 'aep_condition',
    dimensions: 'aep_dimensions',
    weightGrams: 'aep_weightGrams',
    category: 'aep_category',
    subcategory: 'aep_subcategory',
    createdAt: 'aep_createdAt',
    status: 'aep_status',
  },
  inventoryItems: {
    id: 'ii_id',
    aiProductId: 'ii_aiProductId',
    quantityAvailable: 'ii_quantityAvailable',
    marketplaceStatus: 'ii_marketplaceStatus',
  },
  productCustomerProfiles: {
    productId: 'pcp_productId',
    profileId: 'pcp_profileId',
  },
  customerProfiles: {
    id: 'cp_id',
    slug: 'cp_slug',
    nameDe: 'cp_nameDe',
    color: 'cp_color',
    descriptionDe: 'cp_descriptionDe',
  },
  productImages: {
    id: 'pi_id',
    productId: 'pi_productId',
    filePath: 'pi_filePath',
    isPrimary: 'pi_isPrimary',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  desc: (a: unknown) => ({ __desc: a }),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccessCached: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/marketplace-status', () => ({
  MARKETPLACE_STATUS: { PUBLISHED: 'published', DRAFT: 'draft' },
  PRODUCT_STATUS: { APPROVED: 'approved', PENDING_REVIEW: 'pending_review' },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_PRODUCT = {
  id: 'product-1',
  item_uuid: 'uuid-abc',
  product_name: 'ThinkPad X1',
  brand: 'Lenovo',
  short_description: 'Refurbished laptop',
  specifications: { ram: '16GB' },
  estimated_price_chf: '450',
  condition: 'good',
  dimensions: null,
  weight_grams: 1400,
  category: 'laptops',
  subcategory: null,
  created_at: new Date('2024-01-01'),
  quantity_available: 3,
  marketplace_status: 'published',
  status: 'approved',
}

const MOCK_PROFILES = [
  { slug: 'student', name_de: 'Studierende', color: '#blue', description_de: 'Für Studierende' },
]

const MOCK_IMAGES = [
  { id: 'img-1', file_path: '/uploads/product1.jpg', is_primary: true },
]

function makeContext(id = 'product-1') {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(id = 'product-1') {
  return new NextRequest(`http://localhost/api/shop/inventory/${id}`)
}

beforeEach(() => {
  jest.resetAllMocks()
})

describe('GET /api/shop/inventory/[id]', () => {
  it('returns 404 when product not found', async () => {
    // Promise.all: [product, profiles, images] — product empty
    mockSelect
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Produkt nicht gefunden')
  })

  it('returns 404 when product is not published', async () => {
    // Product found but not published
    mockSelect
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ ...MOCK_PRODUCT, marketplace_status: 'draft' }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Produkt nicht verfügbar')
  })

  it('returns 404 when product status is not approved', async () => {
    mockSelect
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ ...MOCK_PRODUCT, status: 'pending_review' }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(404)
  })

  it('returns 200 with full product detail', async () => {
    mockSelect
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([MOCK_PRODUCT]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(MOCK_PROFILES),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(MOCK_IMAGES),
          }),
        }),
      })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.product.id).toBe('product-1')
    expect(body.data.product.title).toBe('Lenovo ThinkPad X1')
    expect(body.data.product.quantity).toBe(3)
    expect(body.data.product.is_available).toBe(true)
    expect(body.data.product.images).toHaveLength(1)
    expect(body.data.product.customer_profiles).toHaveLength(1)
  })

  it('returns 200 with is_available=false when quantity is 0', async () => {
    mockSelect
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ ...MOCK_PRODUCT, quantity_available: 0 }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.product.is_available).toBe(false)
  })
})
