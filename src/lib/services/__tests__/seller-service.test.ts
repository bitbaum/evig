/**
 * Tests for seller-service.ts — seller dashboard data aggregation.
 *
 * Mission-relevant: the seller dashboard is the primary interface for
 * community members selling devices on the P2P marketplace. Wrong stats
 * (revenue, orders, views) erode trust; a price displayed as 0 instead of
 * the real value is a direct financial error.
 *
 * Behaviors locked:
 *   getSellerDashboard — product mapping
 *   - maps price from price_chf as parseFloat
 *   - maps viewsCount from view_count (defaults to 0)
 *   - maps favoritesCount from favorite_count (defaults to 0)
 *   - maps image from thumbnail (null when absent)
 *   - maps condition and category from DB row
 *
 *   getSellerDashboard — stats aggregation
 *   - parses totalProducts / activeProducts as integers
 *   - parses totalViews / totalFavorites as integers
 *   - parses totalOrders / pendingOrders as integers
 *   - parses totalRevenue as parseFloat
 *   - returns zero stats when DB returns an empty row
 *
 *   getSellerDashboard — error handling
 *   - order-stats DB error returns defaults (graceful degradation)
 *   - re-throws when listing-stats query fails
 *
 *   getSellerDashboard — empty products
 *   - returns empty products array when seller has no listings
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
  },
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

jest.mock('@/db/schema', () => ({
  listings: { id: 'listings' },
  listingImages: { id: 'listingImages' },
  marketplaceOrders: { id: 'marketplaceOrders' },
  sellerProfiles: { id: 'sellerProfiles' },
  userProfiles: {
    userId: 'up_userId', displayName: 'up_displayName', bio: 'up_bio',
    avatarUrl: 'up_avatarUrl', isVerified: 'up_isVerified',
  },
}))

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: {
    ACTIVE: 'active',
    RESERVED: 'reserved',
    SOLD: 'sold',
    REMOVED: 'removed',
  },
  ORDER_STATUS: {
    PENDING_PAYMENT: 'pending_payment',
    PAID: 'paid',
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { getSellerDashboard } from '../seller-service'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = 'seller-user-1'

function makeProductRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'lst-1',
    title: 'ThinkPad T480',
    price_chf: '199.00',
    status: 'active',
    view_count: 42,
    favorite_count: 5,
    created_at: '2026-01-01T00:00:00Z',
    condition: 'good',
    category: 'Laptop',
    thumbnail: '/images/thinkpad.jpg',
    ...overrides,
  }
}

function makeListingStatsRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    total_products: '10',
    active_products: '6',
    total_views: '300',
    total_favorites: '15',
    ...overrides,
  }
}

function makeOrderStatsRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    total_orders: '4',
    pending_orders: '1',
    total_revenue: '750.50',
    ...overrides,
  }
}

// resetAllMocks flushes queued mockResolvedValueOnce values between tests,
// preventing leftover queue entries from bleeding across describes.
beforeEach(() => {
  jest.resetAllMocks()
})

// Helper: queue the standard 3-call sequence for getSellerDashboard
function mockDashboard(
  productRows: unknown[] = [makeProductRow()],
  listingStatsRow: unknown = makeListingStatsRow(),
  orderStatsRow: unknown = makeOrderStatsRow(),
) {
  mockDbExecute
    .mockResolvedValueOnce({ rows: productRows })
    .mockResolvedValueOnce({ rows: [listingStatsRow] })
    .mockResolvedValueOnce({ rows: [orderStatsRow] })
}

// ============================================================================
// Product mapping
// ============================================================================

describe('getSellerDashboard — product mapping', () => {
  it('parses price from price_chf as float', async () => {
    mockDashboard()
    const { products } = await getSellerDashboard(USER_ID)
    expect(products[0].price).toBeCloseTo(199.0)
  })

  it('maps viewsCount from view_count', async () => {
    mockDashboard()
    const { products } = await getSellerDashboard(USER_ID)
    expect(products[0].viewsCount).toBe(42)
  })

  it('maps favoritesCount from favorite_count', async () => {
    mockDashboard()
    const { products } = await getSellerDashboard(USER_ID)
    expect(products[0].favoritesCount).toBe(5)
  })

  it('maps image from thumbnail', async () => {
    mockDashboard()
    const { products } = await getSellerDashboard(USER_ID)
    expect(products[0].image).toBe('/images/thinkpad.jpg')
  })

  it('sets image to null when thumbnail is absent', async () => {
    mockDashboard([makeProductRow({ thumbnail: null })])
    const { products } = await getSellerDashboard(USER_ID)
    expect(products[0].image).toBeNull()
  })

  it('maps condition and category from DB row', async () => {
    mockDashboard()
    const { products } = await getSellerDashboard(USER_ID)
    expect(products[0].condition).toBe('good')
    expect(products[0].category).toBe('Laptop')
  })
})

// ============================================================================
// Stats aggregation
// ============================================================================

describe('getSellerDashboard — stats aggregation', () => {
  it('parses totalProducts and activeProducts as integers', async () => {
    mockDashboard([], makeListingStatsRow({ total_products: '10', active_products: '6' }))
    const { stats } = await getSellerDashboard(USER_ID)
    expect(stats.totalProducts).toBe(10)
    expect(stats.activeProducts).toBe(6)
  })

  it('parses totalViews and totalFavorites as integers', async () => {
    mockDashboard([], makeListingStatsRow({ total_views: '300', total_favorites: '15' }))
    const { stats } = await getSellerDashboard(USER_ID)
    expect(stats.totalViews).toBe(300)
    expect(stats.totalFavorites).toBe(15)
  })

  it('parses totalOrders and pendingOrders as integers', async () => {
    mockDashboard([], makeListingStatsRow(), makeOrderStatsRow({ total_orders: '4', pending_orders: '1' }))
    const { stats } = await getSellerDashboard(USER_ID)
    expect(stats.totalOrders).toBe(4)
    expect(stats.pendingOrders).toBe(1)
  })

  it('parses totalRevenue as float', async () => {
    mockDashboard([], makeListingStatsRow(), makeOrderStatsRow({ total_revenue: '750.50' }))
    const { stats } = await getSellerDashboard(USER_ID)
    expect(stats.totalRevenue).toBeCloseTo(750.5)
  })

  it('returns all zeros when DB rows are empty', async () => {
    mockDashboard([], {}, {})
    const { stats } = await getSellerDashboard(USER_ID)
    expect(stats.totalProducts).toBe(0)
    expect(stats.activeProducts).toBe(0)
    expect(stats.totalViews).toBe(0)
    expect(stats.totalFavorites).toBe(0)
    expect(stats.totalOrders).toBe(0)
    expect(stats.pendingOrders).toBe(0)
    expect(stats.totalRevenue).toBe(0)
  })
})

// ============================================================================
// Error handling
// ============================================================================

describe('getSellerDashboard — error handling', () => {
  it('returns order stats defaults when orders query throws (graceful degradation)', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [makeListingStatsRow()] })
      .mockRejectedValueOnce(new Error('relation "marketplace_orders" does not exist'))

    const { stats } = await getSellerDashboard(USER_ID)

    expect(stats.totalOrders).toBe(0)
    expect(stats.pendingOrders).toBe(0)
    expect(stats.totalRevenue).toBe(0)
    expect(stats.totalProducts).toBe(10)
  })

  it('re-throws when the listing-stats query fails', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(new Error('DB connection lost'))
      .mockResolvedValueOnce({ rows: [makeOrderStatsRow()] })

    await expect(getSellerDashboard(USER_ID)).rejects.toThrow('DB connection lost')
  })
})

// ============================================================================
// Empty products
// ============================================================================

describe('getSellerDashboard — empty products', () => {
  it('returns empty products array when seller has no listings', async () => {
    mockDashboard([])
    const { products } = await getSellerDashboard(USER_ID)
    expect(products).toEqual([])
  })
})
