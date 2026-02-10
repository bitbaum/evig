/**
 * Seller Service
 *
 * Business logic for the seller dashboard.
 * Handles product listings, stats aggregation, and order stats
 * for a given seller user.
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

// ============================================================================
// Types
// ============================================================================

interface SellerProductRow {
  id: string
  inventory_item_id: string
  title: string
  description: string
  price_chf: number
  status: string
  views_count: number
  favorites_count: number
  published_at: string
  created_at: string
  condition: string
  quantity_available: number
  category: string
  brand: string
  original_image_url: string
}

export interface SellerProduct {
  id: string
  inventoryItemId: string
  title: string
  description: string
  price: number
  status: string
  viewsCount: number
  favoritesCount: number
  condition: string
  quantityAvailable: number
  category: string
  brand: string
  image: string | null
  publishedAt: string
  createdAt: string
}

export interface SellerStats {
  totalProducts: number
  activeProducts: number
  totalViews: number
  totalFavorites: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
}

export interface SellerDashboardData {
  stats: SellerStats
  products: SellerProduct[]
}

// ============================================================================
// Internal Queries
// ============================================================================

/**
 * Fetch the seller's recent marketplace listings with product details.
 */
async function fetchSellerProducts(userId: string): Promise<SellerProduct[]> {
  const result = await query<SellerProductRow>(
    `SELECT
      ml.id,
      ml.inventory_item_id,
      ml.title,
      ml.description,
      ml.price_chf,
      ml.status,
      ml.views_count,
      ml.favorites_count,
      ml.published_at,
      ml.created_at,
      COALESCE(ii.condition_override, aep.condition) as condition,
      ii.quantity_available,
      aep.category,
      aep.brand,
      aep.original_image_url
     FROM ${TABLE_NAMES.MARKETPLACE_LISTINGS} ml
     LEFT JOIN ${TABLE_NAMES.INVENTORY_ITEMS} ii ON ml.inventory_item_id = ii.id
     LEFT JOIN ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} aep ON ii.ai_product_id = aep.id
     WHERE ml.created_by = $1
     ORDER BY ml.created_at DESC
     LIMIT 10`,
    [userId]
  )

  return result.rows.map((row) => ({
    id: row.id,
    inventoryItemId: row.inventory_item_id,
    title: row.title,
    description: row.description,
    price: parseFloat(String(row.price_chf)),
    status: row.status,
    viewsCount: row.views_count || 0,
    favoritesCount: row.favorites_count || 0,
    condition: row.condition || 'good',
    quantityAvailable: row.quantity_available || 0,
    category: row.category || 'Allgemein',
    brand: row.brand,
    image: row.original_image_url || null,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  }))
}

/**
 * Fetch aggregate listing stats for a seller.
 */
async function fetchListingStats(userId: string) {
  const result = await query<{
    total_products: string
    active_products: string
    total_views: string
    total_favorites: string
  }>(
    `SELECT
      COUNT(*) as total_products,
      COUNT(*) FILTER (WHERE status = 'published') as active_products,
      COALESCE(SUM(views_count), 0) as total_views,
      COALESCE(SUM(favorites_count), 0) as total_favorites
     FROM ${TABLE_NAMES.MARKETPLACE_LISTINGS}
     WHERE created_by = $1`,
    [userId]
  )

  const row = result.rows[0]
  return {
    totalProducts: parseInt(row?.total_products || '0'),
    activeProducts: parseInt(row?.active_products || '0'),
    totalViews: parseInt(row?.total_views || '0'),
    totalFavorites: parseInt(row?.total_favorites || '0'),
  }
}

/**
 * Fetch order-related stats for a seller's products.
 * Gracefully returns defaults if the orders table doesn't exist yet.
 */
async function fetchOrderStats(userId: string) {
  try {
    const result = await query<{
      total_orders: string
      pending_orders: string
      total_revenue: string
    }>(
      `SELECT
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT o.id) FILTER (WHERE o.status IN ('pending', 'processing')) as pending_orders,
        COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0) as total_revenue
       FROM ${TABLE_NAMES.ORDERS} o
       JOIN ${TABLE_NAMES.ORDER_ITEMS} oi ON o.id = oi.order_id
       JOIN ${TABLE_NAMES.MARKETPLACE_LISTINGS} ml ON oi.product_id::uuid = ml.id
       WHERE ml.created_by = $1`,
      [userId]
    )

    const row = result.rows[0]
    return {
      totalOrders: parseInt(row?.total_orders || '0'),
      pendingOrders: parseInt(row?.pending_orders || '0'),
      totalRevenue: parseFloat(row?.total_revenue || '0'),
    }
  } catch {
    // Orders table might not exist yet, continue with defaults
    logger.debug('Orders table query failed, using defaults')
    return { totalOrders: 0, pendingOrders: 0, totalRevenue: 0 }
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get the complete seller dashboard data: stats + recent products.
 */
export async function getSellerDashboard(userId: string): Promise<SellerDashboardData> {
  try {
    // Run all three queries in parallel for performance
    const [products, listingStats, orderStats] = await Promise.all([
      fetchSellerProducts(userId),
      fetchListingStats(userId),
      fetchOrderStats(userId),
    ])

    return {
      stats: {
        ...listingStats,
        ...orderStats,
      },
      products,
    }
  } catch (error) {
    logger.error('Failed to fetch seller dashboard', { userId, error })
    throw error
  }
}
