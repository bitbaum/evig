/**
 * Inventory Products List API
 *
 * GET /api/admin/inventory
 * Lists all products from the ai_extracted_products table with inventory data
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { query, paginatedQuery } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'

export const GET = withAdmin(async (request: NextRequest, session) => {
  try {
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
        OR p.model ILIKE $${paramIndex}
        OR CAST(p.id AS TEXT) ILIKE $${paramIndex}
      )`)
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    // Fetch products with inventory data
    const { rows: productRows, total } = await paginatedQuery<{
      id: string
      product_name: string
      brand: string
      model: string | null
      short_description: string | null
      estimated_price_chf: number
      condition: string
      category: string | null
      subcategory: string | null
      status: string
      created_at: string
      location: string | null
      quantity_available: number
      marketplace_status: string
      kivitendo_article_number: string | null
    }>(
      `SELECT
        p.id,
        p.product_name,
        p.brand,
        p.model,
        p.specifications->>'short_description' as short_description,
        p.estimated_price_chf,
        p.condition,
        p.category,
        p.subcategory,
        p.status,
        p.created_at,
        i.location,
        COALESCE(i.quantity_available, 1) as quantity_available,
        COALESCE(i.marketplace_status, 'draft') as marketplace_status,
        p.kivitendo_article_number
      FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} p
      LEFT JOIN ${TABLE_NAMES.INVENTORY_ITEMS} i ON i.ai_product_id = p.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    // Fetch customer profiles for each product
    const productIds = productRows.map(p => p.id)
    let profilesMap: Record<string, string[]> = {}

    if (productIds.length > 0) {
      const profilesResult = await query<{ product_id: string; slug: string }>(
        `SELECT pcp.product_id, cp.slug
         FROM ${TABLE_NAMES.PRODUCT_CUSTOMER_PROFILES} pcp
         JOIN ${TABLE_NAMES.CUSTOMER_PROFILES} cp ON cp.id = pcp.profile_id
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
    const products = productRows.map(product => ({
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
})
