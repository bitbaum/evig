/**
 * Inventory Product Detail API
 *
 * GET    /api/admin/inventory/[id] - Fetch product details
 * DELETE /api/admin/inventory/[id] - Delete product + related records
 * PUT    /api/admin/inventory/[id] - Update product fields + image
 * PATCH  /api/admin/inventory/[id] - Quick status updates (publish/unpublish)
 */

import { db } from '@/db'
import {
  aiExtractedProducts,
  inventoryItems,
  productImages,
  productCustomerProfiles,
  customerProfiles,
  marketplaceListings,
} from '@/db/schema'
import { eq, sql, inArray, and } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { INTAKE_STATUS } from '@/config/intake-status'
import { publishProduct, unpublishProduct, updateProductImage } from '@/lib/admin/inventory-actions'
import { validateBody, InventoryUpdateSchema, InventoryPatchSchema } from '@/lib/schemas'

export const GET = withAdmin<{ id: string }>('products', async (request, session, context) => {
  try {
    const { id: productId } = context!.params!

    const rows = await db
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
        location: inventoryItems.location,
        box_id: inventoryItems.boxId,
        quantity_available: sql<number>`COALESCE(${inventoryItems.quantityAvailable}, 1)`,
      })
      .from(aiExtractedProducts)
      .leftJoin(inventoryItems, eq(inventoryItems.aiProductId, aiExtractedProducts.id))
      .where(eq(aiExtractedProducts.id, productId))

    if (rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND)
    }

    const product = rows[0]

    const profiles = await db
      .select({ slug: customerProfiles.slug })
      .from(productCustomerProfiles)
      .innerJoin(customerProfiles, eq(customerProfiles.id, productCustomerProfiles.profileId))
      .where(eq(productCustomerProfiles.productId, productId))

    const images = await db
      .select({ file_path: productImages.filePath })
      .from(productImages)
      .where(and(eq(productImages.productId, productId), eq(productImages.isPrimary, true)))
      .limit(1)

    logger.info('Inventory product fetched for factsheet', {
      productId, itemUuid: product.item_uuid, userId: session.user.id,
    })

    return apiSuccess({
      product: {
        ...product,
        customer_profiles: profiles.map(r => r.slug),
        image_url: images[0]?.file_path ?? null,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch inventory product', { error })
    return apiError(error, 'Fehler beim Laden des Produkts')
  }
})

export const DELETE = withAdmin<{ id: string }>('products', async (request, session, context) => {
  try {
    const { id: productId } = context!.params!

    // Delete child tables first, then main record
    await db.delete(productCustomerProfiles).where(eq(productCustomerProfiles.productId, productId))
    await db.delete(productImages).where(eq(productImages.productId, productId))

    // Delete marketplace listings via inventory item subquery
    const invIds = await db
      .select({ id: inventoryItems.id })
      .from(inventoryItems)
      .where(eq(inventoryItems.aiProductId, productId))

    if (invIds.length > 0) {
      await db
        .delete(marketplaceListings)
        .where(inArray(marketplaceListings.inventoryItemId, invIds.map(r => r.id)))
    }

    await db.delete(inventoryItems).where(eq(inventoryItems.aiProductId, productId))

    const deleted = await db
      .delete(aiExtractedProducts)
      .where(eq(aiExtractedProducts.id, productId))
      .returning({ id: aiExtractedProducts.id, itemUuid: aiExtractedProducts.itemUuid })

    if (deleted.length === 0) {
      return apiNotFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND)
    }

    logger.info('Inventory product deleted', {
      productId, itemUuid: deleted[0].itemUuid, deletedBy: session.user.id,
    })

    return apiSuccess({ deleted: deleted[0] })
  } catch (error) {
    logger.error('Failed to delete inventory product', { error })
    return apiError(error, 'Fehler beim Löschen des Produkts')
  }
})

export const PUT = withAdmin<{ id: string }>('products', async (request, session, context) => {
  try {
    const { id: productId } = context!.params!
    const rawBody = await request.json()
    const validation = validateBody(InventoryUpdateSchema, rawBody)
    if (!validation.success) return validation.error
    const body = validation.data as Record<string, unknown>

    // Build dynamic update for product fields (map snake_case input to camelCase schema)
    const productUpdate: Record<string, unknown> = {}
    if (body.product_name !== undefined) productUpdate.productName = body.product_name
    if (body.brand !== undefined) productUpdate.brand = body.brand
    if (body.short_description !== undefined) productUpdate.shortDescription = body.short_description
    if (body.specifications !== undefined) productUpdate.specifications = body.specifications
    if (body.estimated_price_chf !== undefined) productUpdate.estimatedPriceChf = String(body.estimated_price_chf)
    if (body.condition !== undefined) productUpdate.condition = body.condition
    if (body.category !== undefined) productUpdate.category = body.category
    if (body.subcategory !== undefined) productUpdate.subcategory = body.subcategory
    if (body.dimensions !== undefined) productUpdate.dimensions = body.dimensions
    if (body.weight_grams !== undefined) productUpdate.weightGrams = body.weight_grams
    if (body.status !== undefined) productUpdate.status = body.status

    if (Object.keys(productUpdate).length === 0) {
      return apiError(new Error('No valid fields to update'), 'Keine gültigen Felder zum Aktualisieren', 400)
    }

    productUpdate.updatedAt = sql`NOW()`

    const result = await db
      .update(aiExtractedProducts)
      .set(productUpdate)
      .where(eq(aiExtractedProducts.id, productId))
      .returning()

    if (result.length === 0) {
      return apiNotFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND)
    }

    // Update inventory item if location/quantity fields provided
    const invUpdate: Record<string, unknown> = {}
    if (body.location !== undefined) invUpdate.location = body.location
    if (body.box_id !== undefined) invUpdate.boxId = body.box_id
    if (body.quantity_available !== undefined) invUpdate.quantityAvailable = body.quantity_available

    if (Object.keys(invUpdate).length > 0) {
      invUpdate.updatedAt = sql`NOW()`
      await db
        .update(inventoryItems)
        .set(invUpdate)
        .where(eq(inventoryItems.aiProductId, productId))
    }

    // Handle image update
    let imageUrl: string | null = null
    if (body.image && typeof body.image === 'string') {
      imageUrl = await updateProductImage(productId, body.image as string, session.user.id)
    }

    const allowedFields = [
      'product_name', 'brand', 'short_description', 'specifications',
      'estimated_price_chf', 'condition', 'category', 'subcategory',
      'dimensions', 'weight_grams', 'status',
    ]

    logger.info('Inventory product updated', {
      productId,
      updatedFields: Object.keys(body).filter(k => allowedFields.includes(k)),
      updatedBy: session.user.id,
    })

    return apiSuccess({ product: result[0], image_url: imageUrl })
  } catch (error) {
    logger.error('Failed to update inventory product', { error })
    return apiError(error, 'Fehler beim Aktualisieren des Produkts')
  }
})

export const PATCH = withAdmin<{ id: string }>('products', async (request, session, context) => {
  try {
    const { id: productId } = context!.params!
    const rawBody = await request.json()
    const patchValidation = validateBody(InventoryPatchSchema, rawBody)
    if (!patchValidation.success) return patchValidation.error
    const body = patchValidation.data

    // Handle marketplace publish/unpublish
    if (body.marketplace_status !== undefined) {
      await db
        .update(inventoryItems)
        .set({ marketplaceStatus: body.marketplace_status, updatedAt: sql`NOW()` })
        .where(eq(inventoryItems.aiProductId, productId))

      if (body.marketplace_status === INTAKE_STATUS.PUBLISHED) {
        await publishProduct(productId, session.user.id)
      } else {
        await unpublishProduct(productId, session.user.id)
      }
    }

    // Handle product status change
    if (body.status !== undefined) {
      await db
        .update(aiExtractedProducts)
        .set({ status: body.status, updatedAt: sql`NOW()` })
        .where(eq(aiExtractedProducts.id, productId))

      logger.info('Product status changed', {
        productId, newStatus: body.status, changedBy: session.user.id,
      })
    }

    return apiSuccess({
      productId,
      marketplace_status: body.marketplace_status,
      status: body.status,
    })
  } catch (error) {
    logger.error('Failed to patch inventory product', { error })
    return apiError(error, 'Fehler beim Aktualisieren des Produkts')
  }
})
