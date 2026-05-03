/**
 * Public Shop Inventory Product Detail API
 *
 * GET /api/shop/inventory/[id]
 * Returns a single published inventory product for the public shop
 */

import { NextRequest } from 'next/server'
import { apiSuccessCached, apiError, apiNotFound } from '@/lib/api/helpers'
import { db } from '@/db'
import { aiExtractedProducts, inventoryItems, productCustomerProfiles, customerProfiles, productImages } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { MARKETPLACE_STATUS, PRODUCT_STATUS } from '@/config/marketplace-status'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params

    // Fetch product with inventory data, customer profiles, and images in parallel
    const [[product], profiles, images] = await Promise.all([
      db
        .select({
          id: aiExtractedProducts.id,
          item_uuid: aiExtractedProducts.itemUuid,
          product_name: aiExtractedProducts.productName,
          brand: aiExtractedProducts.brand,
          short_description: aiExtractedProducts.shortDescription,
          specifications: aiExtractedProducts.specifications,
          estimated_price_chf: aiExtractedProducts.estimatedPriceChf,
          condition: aiExtractedProducts.condition,
          dimensions: aiExtractedProducts.dimensions,
          weight_grams: aiExtractedProducts.weightGrams,
          category: aiExtractedProducts.category,
          subcategory: aiExtractedProducts.subcategory,
          created_at: aiExtractedProducts.createdAt,
          quantity_available: inventoryItems.quantityAvailable,
          marketplace_status: inventoryItems.marketplaceStatus,
          status: aiExtractedProducts.status,
        })
        .from(aiExtractedProducts)
        .innerJoin(inventoryItems, eq(inventoryItems.aiProductId, aiExtractedProducts.id))
        .where(eq(aiExtractedProducts.id, productId)),

      db
        .select({
          slug: customerProfiles.slug,
          name_de: customerProfiles.nameDe,
          color: customerProfiles.color,
          description_de: customerProfiles.descriptionDe,
        })
        .from(productCustomerProfiles)
        .innerJoin(customerProfiles, eq(customerProfiles.id, productCustomerProfiles.profileId))
        .where(eq(productCustomerProfiles.productId, productId)),

      db
        .select({
          id: productImages.id,
          file_path: productImages.filePath,
          is_primary: productImages.isPrimary,
        })
        .from(productImages)
        .where(eq(productImages.productId, productId))
        .orderBy(desc(productImages.isPrimary)),
    ])

    if (!product) {
      return apiNotFound('Produkt')
    }

    if (product.marketplace_status !== MARKETPLACE_STATUS.PUBLISHED || product.status !== PRODUCT_STATUS.APPROVED) {
      return apiNotFound('Produkt')
    }

    const quantityAvailable = Number(product.quantity_available ?? 0)

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
      quantity: quantityAvailable,
      is_available: quantityAvailable > 0,
      images: images.map(img => ({
        id: img.id,
        url: img.file_path,
        is_primary: img.is_primary,
      })),
      customer_profiles: profiles,
      created_at: product.created_at,
    }

    logger.info('Shop inventory product fetched', {
      productId,
      itemUuid: product.item_uuid,
    })

    // Product detail is public — cache 30s (availability may change), stale 15s
    return apiSuccessCached({ product: result }, 30, 15)
  } catch (error) {
    logger.error('Failed to fetch shop inventory product', { error })
    return apiError(error, 'Fehler beim Laden des Produkts')
  }
}
