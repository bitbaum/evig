/**
 * Seller Service
 *
 * Business logic for the seller dashboard.
 * Handles product listings, stats aggregation, and order stats
 * for a given seller user.
 */

import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { listings, listingImages, marketplaceOrders } from '@/db/schema'
import { logger } from '@/lib/logger'
import { LISTING_STATUS } from '@/config/marketplace'

// Table name refs for raw SQL
const listingsTable = getTableName(listings)
const listingImagesTable = getTableName(listingImages)
const ordersTable = getTableName(marketplaceOrders)

// ============================================================================
// Types
// ============================================================================

interface SellerProductRow {
  id: string
  title: string
  price_chf: number
  status: string
  view_count: number
  favorite_count: number
  created_at: string
  condition: string
  category: string
  thumbnail: string | null
}

export interface SellerProduct {
  id: string
  title: string
  price: number
  status: string
  viewsCount: number
  favoritesCount: number
  condition: string
  category: string
  image: string | null
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
 * Fetch the seller's recent marketplace listings.
 */
async function fetchSellerProducts(userId: string): Promise<SellerProduct[]> {
  const result = await db.execute(sql`
    SELECT
      l.id,
      l.title,
      l.price_chf,
      l.status,
      l.view_count,
      l.favorite_count,
      l.created_at,
      l.condition,
      l.category,
      (SELECT li.url FROM ${sql.raw(listingImagesTable)} li WHERE li.listing_id = l.id AND li.is_primary = true LIMIT 1) as thumbnail
    FROM ${sql.raw(listingsTable)} l
    WHERE l.seller_id = ${userId}
    ORDER BY l.created_at DESC
    LIMIT 10
  `)

  return (result.rows as unknown as SellerProductRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    price: parseFloat(String(row.price_chf)),
    status: row.status,
    viewsCount: row.view_count || 0,
    favoritesCount: row.favorite_count || 0,
    condition: row.condition || 'good',
    category: row.category || 'Allgemein',
    image: row.thumbnail || null,
    createdAt: row.created_at,
  }))
}

/**
 * Fetch aggregate listing stats for a seller.
 */
async function fetchListingStats(userId: string) {
  const result = await db.execute(sql`
    SELECT
      COUNT(*) as total_products,
      COUNT(*) FILTER (WHERE status = ${LISTING_STATUS.ACTIVE}) as active_products,
      COALESCE(SUM(view_count), 0) as total_views,
      COALESCE(SUM(favorite_count), 0) as total_favorites
    FROM ${sql.raw(listingsTable)}
    WHERE seller_id = ${userId} AND status != ${LISTING_STATUS.REMOVED}
  `)

  const row = (result.rows as unknown as {
    total_products: string
    active_products: string
    total_views: string
    total_favorites: string
  }[])[0]

  return {
    totalProducts: parseInt(row?.total_products || '0'),
    activeProducts: parseInt(row?.active_products || '0'),
    totalViews: parseInt(row?.total_views || '0'),
    totalFavorites: parseInt(row?.total_favorites || '0'),
  }
}

/**
 * Fetch order-related stats for a seller.
 * Gracefully returns defaults if the orders table doesn't exist yet.
 */
async function fetchOrderStats(userId: string) {
  try {
    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status IN ('pending_payment', 'paid')) as pending_orders,
        COALESCE(SUM(seller_payout_chf), 0) as total_revenue
      FROM ${sql.raw(ordersTable)}
      WHERE seller_id = ${userId}
    `)

    const row = (result.rows as unknown as {
      total_orders: string
      pending_orders: string
      total_revenue: string
    }[])[0]

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
