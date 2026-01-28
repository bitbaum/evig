/**
 * Inventory Product Detail API
 *
 * GET /api/admin/inventory/[id]
 * Fetches detailed inventory product information including customer profiles
 * Used by the factsheet/label template
 */

import { NextRequest } from 'next/server'
import { apiSuccess, apiError, apiNotFound, apiUnauthorized } from '@/lib/api/helpers'
import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { auth } from '@/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Nicht angemeldet')
    }

    const { id: productId } = await params

    // Fetch product with inventory and customer profiles
    const productResult = await query<{
      id: string
      item_uuid: string
      product_name: string
      brand: string
      short_description: string | null
      specifications: Record<string, string>
      estimated_price_chf: number
      condition: string
      dimensions: Record<string, number | null>
      weight_grams: number | null
      category: string | null
      subcategory: string | null
      created_at: string
      location: string | null
      box_id: string | null
      quantity_available: number
    }>(
      `SELECT
        p.id,
        p.item_uuid,
        p.product_name,
        p.brand,
        p.short_description,
        p.specifications,
        p.estimated_price_chf,
        p.condition,
        p.dimensions,
        p.weight_grams,
        p.category,
        p.subcategory,
        p.created_at,
        i.location,
        i.box_id,
        COALESCE(i.quantity_available, 1) as quantity_available
      FROM ai_extracted_products p
      LEFT JOIN inventory_items i ON i.ai_product_id = p.id
      WHERE p.id = $1`,
      [productId]
    )

    if (productResult.rows.length === 0) {
      return apiNotFound('Produkt nicht gefunden')
    }

    const product = productResult.rows[0]

    // Fetch customer profiles for this product
    const profilesResult = await query<{ slug: string }>(
      `SELECT cp.slug
       FROM ${TABLE_NAMES.PRODUCT_CUSTOMER_PROFILES} pcp
       JOIN ${TABLE_NAMES.CUSTOMER_PROFILES} cp ON cp.id = pcp.profile_id
       WHERE pcp.product_id = $1`,
      [productId]
    )

    const customerProfiles = profilesResult.rows.map(r => r.slug)

    // Fetch primary image if exists
    const imageResult = await query<{ file_path: string }>(
      `SELECT file_path
       FROM product_images
       WHERE product_id = $1 AND is_primary = true
       LIMIT 1`,
      [productId]
    )

    const imageUrl = imageResult.rows.length > 0 ? imageResult.rows[0].file_path : null

    logger.info('Inventory product fetched for factsheet', {
      productId,
      itemUuid: product.item_uuid,
      userId: session.user.id,
    })

    return apiSuccess({
      product: {
        ...product,
        customer_profiles: customerProfiles,
        image_url: imageUrl,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch inventory product', { error })
    return apiError(error, 'Fehler beim Laden des Produkts')
  }
}
