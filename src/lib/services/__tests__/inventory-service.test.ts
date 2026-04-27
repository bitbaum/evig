/**
 * Tests for inventory-service.ts — the public shop data layer.
 *
 * Mission-relevant: this is the primary read path for the RevampIT shop that
 * lists refurbished computers for sale. A regression here means the shop shows
 * wrong prices, broken titles, or missing products — directly impeding hardware
 * rehoming.
 *
 * Behaviors locked:
 *   - getInventoryProducts returns mapped products, total, limit, offset
 *   - product title = "<brand> <product_name>"
 *   - product model = product_name
 *   - price is parsed as float from the DB column
 *   - price defaults to 0 when column is missing/null
 *   - customer_profiles defaulted to [] when product has no profiles
 *   - customer_profiles attached when profiles exist in the map
 *   - getInventoryProducts returns total from first row's _total_count
 *   - getInventoryProducts returns total=0 and empty array on no rows
 *   - getInventoryProductByUuid returns null when no row found
 *   - getInventoryProductByUuid returns a mapped InventoryProduct on hit
 *   - getInventoryProductByUuid includes profiles for the product
 *   - both functions re-throw on DB error
 */

// ---------------------------------------------------------------------------
// Drizzle / DB mocks — must be declared before jest.mock calls
// ---------------------------------------------------------------------------

const mockDbExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  aiExtractedProducts: { id: 'aep' },
  inventoryItems: { id: 'ii' },
  productImages: { id: 'pi' },
  productCustomerProfiles: { id: 'pcp' },
  customerProfiles: { id: 'cp' },
}))

jest.mock('drizzle-orm', () => {
  const sqlFn = jest.fn().mockReturnValue({ __sql: 'mocked' })
  ;(sqlFn as unknown as Record<string, unknown>).raw = jest.fn().mockReturnValue({ __sql: 'raw' })
  ;(sqlFn as unknown as Record<string, unknown>).join = jest.fn().mockReturnValue({ __sql: 'joined' })
  return {
    ...jest.requireActual('drizzle-orm'),
    sql: sqlFn,
    getTableName: jest.fn().mockReturnValue('mock_table'),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  getInventoryProducts,
  getInventoryProductByUuid,
} from '../inventory-service'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeProductRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'prod-1',
    item_uuid: 'item-uuid-1',
    product_name: 'ThinkPad X1 Carbon',
    brand: 'Lenovo',
    short_description: 'Leichtes Business-Notebook',
    estimated_price_chf: 450,
    condition: 'good',
    category: 'Laptop',
    subcategory: null,
    quantity_available: 3,
    image_url: '/images/thinkpad.jpg',
    _total_count: '12',
    ...overrides,
  }
}

function makeProfileRow(productId = 'prod-1') {
  return {
    product_id: productId,
    slug: 'studenten',
    name_de: 'Studenten',
    color: '#3B82F6',
  }
}

const BASE_FILTERS = { limit: 20, offset: 0 }

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================================
// getInventoryProducts — product shape
// ============================================================================

describe('getInventoryProducts — product shape', () => {
  it('builds title from "<brand> <product_name>"', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeProductRow()] }) // products
      .mockResolvedValueOnce({ rows: [] })                 // profiles

    const result = await getInventoryProducts(BASE_FILTERS)

    expect(result.products[0].title).toBe('Lenovo ThinkPad X1 Carbon')
  })

  it('sets model to product_name', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeProductRow()] })
      .mockResolvedValueOnce({ rows: [] })

    const { products } = await getInventoryProducts(BASE_FILTERS)

    expect(products[0].model).toBe('ThinkPad X1 Carbon')
  })

  it('parses price as float', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeProductRow({ estimated_price_chf: '449.90' })] })
      .mockResolvedValueOnce({ rows: [] })

    const { products } = await getInventoryProducts(BASE_FILTERS)

    expect(products[0].price).toBeCloseTo(449.90)
  })

  it('defaults price to 0 when estimated_price_chf is null', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeProductRow({ estimated_price_chf: null })] })
      .mockResolvedValueOnce({ rows: [] })

    const { products } = await getInventoryProducts(BASE_FILTERS)

    expect(products[0].price).toBe(0)
  })

  it('passes through condition, category, subcategory, image_url', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeProductRow()] })
      .mockResolvedValueOnce({ rows: [] })

    const { products } = await getInventoryProducts(BASE_FILTERS)
    const p = products[0]

    expect(p.condition).toBe('good')
    expect(p.category).toBe('Laptop')
    expect(p.subcategory).toBeNull()
    expect(p.image_url).toBe('/images/thinkpad.jpg')
  })

  it('sets quantity from quantity_available', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeProductRow({ quantity_available: 5 })] })
      .mockResolvedValueOnce({ rows: [] })

    const { products } = await getInventoryProducts(BASE_FILTERS)

    expect(products[0].quantity).toBe(5)
  })
})

// ============================================================================
// getInventoryProducts — customer profiles
// ============================================================================

describe('getInventoryProducts — customer profiles', () => {
  it('defaults customer_profiles to [] when no profiles exist', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeProductRow()] })
      .mockResolvedValueOnce({ rows: [] }) // no profiles

    const { products } = await getInventoryProducts(BASE_FILTERS)

    expect(products[0].customer_profiles).toEqual([])
  })

  it('attaches profiles when they exist for the product', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeProductRow()] })
      .mockResolvedValueOnce({ rows: [makeProfileRow('prod-1')] })

    const { products } = await getInventoryProducts(BASE_FILTERS)

    expect(products[0].customer_profiles).toHaveLength(1)
    expect(products[0].customer_profiles[0]).toMatchObject({
      slug: 'studenten',
      name_de: 'Studenten',
      color: '#3B82F6',
    })
  })

  it('attaches multiple profiles to the correct product', async () => {
    const rows = [makeProductRow({ id: 'prod-1' }), makeProductRow({ id: 'prod-2', item_uuid: 'uuid-2' })]
    mockDbExecute
      .mockResolvedValueOnce({ rows })
      .mockResolvedValueOnce({
        rows: [
          makeProfileRow('prod-1'),
          { product_id: 'prod-2', slug: 'senioren', name_de: 'Senioren', color: '#10B981' },
        ],
      })

    const { products } = await getInventoryProducts(BASE_FILTERS)

    expect(products[0].customer_profiles[0].slug).toBe('studenten')
    expect(products[1].customer_profiles[0].slug).toBe('senioren')
  })
})

// ============================================================================
// getInventoryProducts — pagination / metadata
// ============================================================================

describe('getInventoryProducts — pagination metadata', () => {
  it('returns total from first row _total_count', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeProductRow({ _total_count: '42' })] })
      .mockResolvedValueOnce({ rows: [] })

    const result = await getInventoryProducts({ limit: 10, offset: 0 })

    expect(result.total).toBe(42)
  })

  it('returns total=0 and empty products when no rows', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [] }) // no products
    // fetchProfilesForProducts returns early for empty array — no second call

    const result = await getInventoryProducts(BASE_FILTERS)

    expect(result.total).toBe(0)
    expect(result.products).toEqual([])
  })

  it('echoes back limit and offset from filters', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [] })

    const result = await getInventoryProducts({ limit: 15, offset: 30 })

    expect(result.limit).toBe(15)
    expect(result.offset).toBe(30)
  })
})

// ============================================================================
// getInventoryProducts — error handling
// ============================================================================

describe('getInventoryProducts — error handling', () => {
  it('re-throws DB errors', async () => {
    mockDbExecute.mockRejectedValueOnce(new Error('DB connection lost'))

    await expect(getInventoryProducts(BASE_FILTERS)).rejects.toThrow('DB connection lost')
  })
})

// ============================================================================
// getInventoryProductByUuid
// ============================================================================

describe('getInventoryProductByUuid', () => {
  it('returns null when no product is found', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await getInventoryProductByUuid('unknown-uuid')

    expect(result).toBeNull()
  })

  it('returns a mapped InventoryProduct when found', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeProductRow()] })
      .mockResolvedValueOnce({ rows: [] }) // profiles

    const result = await getInventoryProductByUuid('item-uuid-1')

    expect(result).not.toBeNull()
    expect(result?.title).toBe('Lenovo ThinkPad X1 Carbon')
    expect(result?.item_uuid).toBe('item-uuid-1')
  })

  it('includes profiles for the returned product', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeProductRow()] })
      .mockResolvedValueOnce({ rows: [makeProfileRow('prod-1')] })

    const result = await getInventoryProductByUuid('item-uuid-1')

    expect(result?.customer_profiles).toHaveLength(1)
    expect(result?.customer_profiles[0].slug).toBe('studenten')
  })

  it('re-throws DB errors', async () => {
    mockDbExecute.mockRejectedValueOnce(new Error('timeout'))

    await expect(getInventoryProductByUuid('uuid-x')).rejects.toThrow('timeout')
  })
})
