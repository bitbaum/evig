/**
 * Seller Dashboard API
 * GET /api/seller/dashboard - Get seller dashboard stats and products
 */

import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { auth } from '@/auth'
import { ROLES } from '@/lib/constants'

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

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized('Anmeldung erforderlich')
    }

    const userRole = session.user.role as string
    const hasAccess = userRole === ROLES.SELLER || userRole === ROLES.REVAMPIT_ADMIN

    if (!hasAccess) {
      return apiUnauthorized('Seller-Berechtigung erforderlich')
    }

    const userId = session.user.id

    // Fetch seller's products
    const productsResult = await query<SellerProductRow>(
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

    // Fetch stats
    const statsResult = await query<{
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

    // Fetch order stats (count of orders for this seller's products)
    let ordersStats = { total_orders: '0', pending_orders: '0', total_revenue: '0' }
    try {
      const ordersResult = await query<{
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
      if (ordersResult.rows[0]) {
        ordersStats = ordersResult.rows[0]
      }
    } catch {
      // Orders table might not exist yet, continue with defaults
      logger.debug('Orders table query failed, using defaults')
    }

    const stats = statsResult.rows[0] || {
      total_products: '0',
      active_products: '0',
      total_views: '0',
      total_favorites: '0',
    }

    // Transform products
    const products = productsResult.rows.map(row => ({
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

    return apiSuccess({
      stats: {
        totalProducts: parseInt(stats.total_products),
        activeProducts: parseInt(stats.active_products),
        totalViews: parseInt(stats.total_views),
        totalFavorites: parseInt(stats.total_favorites),
        totalOrders: parseInt(ordersStats.total_orders),
        pendingOrders: parseInt(ordersStats.pending_orders),
        totalRevenue: parseFloat(ordersStats.total_revenue),
      },
      products,
    })
  } catch (error) {
    logger.error('Failed to fetch seller dashboard', { error })
    return apiError(error, 'Dashboard konnte nicht geladen werden')
  }
}
