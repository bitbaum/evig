/**
 * Inventory Products List API
 *
 * GET /api/admin/inventory
 * Lists all products from the ai_extracted_products table with inventory data
 */

import { NextRequest } from 'next/server'
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api/helpers'
import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Nicht angemeldet')
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') // pending_review, approved, draft
    const search = searchParams.get('search')

    // Build WHERE clause
    const conditions: string[] = []
    const params: (string | number)[] = []
    let paramIndex = 1

    if (status) {
      conditions.push(`p.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (search) {
      conditions.push(`(
        p.product_name ILIKE $${paramIndex}
        OR p.brand ILIKE $${paramIndex}
        OR p.item_uuid ILIKE $${paramIndex}
      )`)
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    // Fetch products with inventory data
    const productsResult = await query<{
      id: string
      item_uuid: string
      product_name: string
      brand: string
      short_description: string | null
      estimated_price_chf: number
      condition: string
      category: string | null
      subcategory: string | null
      status: string
      created_at: string
      location: string | null
      box_id: string | null
      quantity_available: number
      marketplace_status: string
    }>(
      `SELECT
        p.id,
        p.item_uuid,
        p.product_name,
        p.brand,
        p.short_description,
        p.estimated_price_chf,
        p.condition,
        p.category,
        p.subcategory,
        p.status,
        p.created_at,
        i.location,
        i.box_id,
        COALESCE(i.quantity_available, 1) as quantity_available,
        COALESCE(i.marketplace_status, 'draft') as marketplace_status
      FROM ai_extracted_products p
      LEFT JOIN inventory_items i ON i.ai_product_id = p.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM ai_extracted_products p
       ${whereClause}`,
      params
    )

    const total = parseInt(countResult.rows[0]?.count || '0')

    // Fetch customer profiles for each product
    const productIds = productsResult.rows.map(p => p.id)
    let profilesMap: Record<string, string[]> = {}

    if (productIds.length > 0) {
      const profilesResult = await query<{ product_id: string; slug: string }>(
        `SELECT pcp.product_id, cp.slug
         FROM product_customer_profiles pcp
         JOIN customer_profiles cp ON cp.id = pcp.profile_id
         WHERE pcp.product_id = ANY($1)`,
        [productIds]
      )

      profilesMap = profilesResult.rows.reduce((acc, row) => {
        if (!acc[row.product_id]) {
          acc[row.product_id] = []
        }
        acc[row.product_id].push(row.slug)
        return acc
      }, {} as Record<string, string[]>)
    }

    // Combine products with profiles
    const products = productsResult.rows.map(product => ({
      ...product,
      customer_profiles: profilesMap[product.id] || [],
    }))

    logger.info('Inventory products fetched', {
      userId: session.user.id,
      count: products.length,
      total,
    })

    return apiSuccess({
      products,
      total,
      limit,
      offset,
    })
  } catch (error) {
    logger.error('Failed to fetch inventory products', { error })
    return apiError(error, 'Fehler beim Laden der Produkte')
  }
}
