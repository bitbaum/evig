/**
 * Public Shop Inventory API
 *
 * GET /api/shop/inventory
 * Returns published inventory products for the public shop
 */

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const profile = searchParams.get('profile') // Filter by customer profile

    // Build WHERE clause - only show published products
    const conditions: string[] = [
      "i.marketplace_status = 'published'",
      "p.status = 'approved'",
      "i.quantity_available > 0",
    ]
    const params: (string | number)[] = []
    let paramIndex = 1

    if (category) {
      conditions.push(`(p.category ILIKE $${paramIndex} OR p.subcategory ILIKE $${paramIndex})`)
      params.push(`%${category}%`)
      paramIndex++
    }

    if (search) {
      conditions.push(`(
        p.product_name ILIKE $${paramIndex}
        OR p.brand ILIKE $${paramIndex}
        OR p.short_description ILIKE $${paramIndex}
      )`)
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    // If filtering by profile, use a subquery
    let profileJoin = ''
    if (profile) {
      profileJoin = `
        JOIN product_customer_profiles pcp ON pcp.product_id = p.id
        JOIN customer_profiles cp ON cp.id = pcp.profile_id AND cp.slug = $${paramIndex}
      `
      params.push(profile)
      paramIndex++
    }

    // Fetch published products
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
      quantity_available: number
      image_url: string | null
    }>(
      `SELECT DISTINCT
        p.id,
        p.item_uuid,
        p.product_name,
        p.brand,
        p.short_description,
        p.estimated_price_chf,
        p.condition,
        p.category,
        p.subcategory,
        i.quantity_available,
        (SELECT file_path FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) as image_url
      FROM ai_extracted_products p
      JOIN inventory_items i ON i.ai_product_id = p.id
      ${profileJoin}
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT p.id) as count
       FROM ai_extracted_products p
       JOIN inventory_items i ON i.ai_product_id = p.id
       ${profileJoin}
       ${whereClause}`,
      params
    )

    const total = parseInt(countResult.rows[0]?.count || '0')

    // Fetch customer profiles for each product
    const productIds = productsResult.rows.map(p => p.id)
    let profilesMap: Record<string, Array<{ slug: string; name_de: string; color: string }>> = {}

    if (productIds.length > 0) {
      const profilesResult = await query<{
        product_id: string
        slug: string
        name_de: string
        color: string
      }>(
        `SELECT pcp.product_id, cp.slug, cp.name_de, cp.color
         FROM product_customer_profiles pcp
         JOIN customer_profiles cp ON cp.id = pcp.profile_id
         WHERE pcp.product_id = ANY($1)`,
        [productIds]
      )

      profilesMap = profilesResult.rows.reduce((acc, row) => {
        if (!acc[row.product_id]) {
          acc[row.product_id] = []
        }
        acc[row.product_id].push({
          slug: row.slug,
          name_de: row.name_de,
          color: row.color,
        })
        return acc
      }, {} as Record<string, Array<{ slug: string; name_de: string; color: string }>>)
    }

    // Combine products with profiles
    const products = productsResult.rows.map(product => ({
      id: product.id,
      item_uuid: product.item_uuid,
      title: `${product.brand} ${product.product_name}`,
      brand: product.brand,
      model: product.product_name,
      description: product.short_description,
      price: product.estimated_price_chf,
      condition: product.condition,
      category: product.category,
      subcategory: product.subcategory,
      quantity: product.quantity_available,
      image_url: product.image_url,
      customer_profiles: profilesMap[product.id] || [],
    }))

    logger.info('Shop inventory products fetched', {
      count: products.length,
      total,
      filters: { category, search, profile },
    })

    return apiSuccess({
      products,
      total,
      limit,
      offset,
    })
  } catch (error) {
    logger.error('Failed to fetch shop inventory products', { error })
    return apiError(error, 'Fehler beim Laden der Produkte')
  }
}
