/**
 * Public Shop Inventory Product Detail API
 *
 * GET /api/shop/inventory/[id]
 * Returns a single published inventory product for the public shop
 */

import { NextRequest } from 'next/server'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers'
import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params

    // Fetch published product with inventory data
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
      quantity_available: number
      marketplace_status: string
      status: string
      created_at: string
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
        i.quantity_available,
        i.marketplace_status,
        p.status
      FROM ai_extracted_products p
      JOIN inventory_items i ON i.ai_product_id = p.id
      WHERE p.id = $1`,
      [productId]
    )

    if (productResult.rows.length === 0) {
      return apiNotFound('Produkt nicht gefunden')
    }

    const product = productResult.rows[0]

    // Check if product is published
    if (product.marketplace_status !== 'published' || product.status !== 'approved') {
      return apiNotFound('Produkt nicht verfügbar')
    }

    // Fetch customer profiles
    const profilesResult = await query<{
      slug: string
      name_de: string
      color: string
      description_de: string
    }>(
      `SELECT cp.slug, cp.name_de, cp.color, cp.description_de
       FROM product_customer_profiles pcp
       JOIN customer_profiles cp ON cp.id = pcp.profile_id
       WHERE pcp.product_id = $1`,
      [productId]
    )

    // Fetch product images
    const imagesResult = await query<{
      id: string
      file_path: string
      is_primary: boolean
    }>(
      `SELECT id, file_path, is_primary
       FROM product_images
       WHERE product_id = $1
       ORDER BY is_primary DESC`,
      [productId]
    )

    const result = {
      id: product.id,
      item_uuid: product.item_uuid,
      title: `${product.brand} ${product.product_name}`,
      brand: product.brand,
      model: product.product_name,
      description: product.short_description,
      specifications: product.specifications || {},
      price: product.estimated_price_chf,
      condition: product.condition,
      dimensions: product.dimensions,
      weight_grams: product.weight_grams,
      category: product.category,
      subcategory: product.subcategory,
      quantity: product.quantity_available,
      is_available: product.quantity_available > 0,
      images: imagesResult.rows.map(img => ({
        id: img.id,
        url: img.file_path,
        is_primary: img.is_primary,
      })),
      customer_profiles: profilesResult.rows,
      created_at: product.created_at,
    }

    logger.info('Shop inventory product fetched', {
      productId,
      itemUuid: product.item_uuid,
    })

    return apiSuccess({ product: result })
  } catch (error) {
    logger.error('Failed to fetch shop inventory product', { error })
    return apiError(error, 'Fehler beim Laden des Produkts')
  }
}
