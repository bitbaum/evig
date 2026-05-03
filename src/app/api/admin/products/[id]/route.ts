import { NextRequest } from "next/server"
import { db } from "@/db"
import { aiExtractedProducts, inventoryItems } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/helpers"
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from "@/lib/logger"
import { withAdmin } from "@/lib/api/middleware"
import { validateBody, AdminUpdateProductSchema } from '@/lib/schemas'

// GET /api/admin/products/[id] - Get single product
export const GET = withAdmin<{ id: string }>('products', async (
  request: NextRequest,
  session,
  context
) => {
  try {
    const params = context?.params
    if (!params?.id) {
      return apiError(new Error("Product ID required"), "Product ID required", 400)
    }

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
        status: aiExtractedProducts.status,
        quantity_available: inventoryItems.quantityAvailable,
        marketplace_status: inventoryItems.marketplaceStatus,
        created_at: aiExtractedProducts.createdAt,
        updated_at: aiExtractedProducts.updatedAt,
      })
      .from(aiExtractedProducts)
      .leftJoin(inventoryItems, eq(inventoryItems.aiProductId, aiExtractedProducts.id))
      .where(eq(aiExtractedProducts.id, params.id))

    if (rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND)
    }

    return apiSuccess({ product: rows[0] })
  } catch (error) {
    logger.error("Failed to fetch product", { error, productId: context?.params?.id })
    return apiError(error, "Fehler beim Laden des Produkts")
  }
})

// PUT /api/admin/products/[id] - Update product
export const PUT = withAdmin<{ id: string }>('products', async (
  request: NextRequest,
  session,
  context
) => {
  try {
    const params = context?.params
    if (!params?.id) {
      return apiError(new Error("Product ID required"), "Product ID required", 400)
    }

    const body = await request.json()
    const validation = validateBody(AdminUpdateProductSchema, body)
    if (!validation.success) return validation.error
    const data = validation.data

    // Map input aliases to DB columns and build update object
    const productUpdate: Record<string, unknown> = {}
    if (data.product_name !== undefined || data.title !== undefined) {
      productUpdate.productName = data.product_name ?? data.title
    }
    if (data.brand !== undefined) productUpdate.brand = data.brand
    if (data.short_description !== undefined || data.description !== undefined) {
      productUpdate.shortDescription = data.short_description ?? data.description
    }
    if (data.estimated_price_chf !== undefined || data.price !== undefined) {
      productUpdate.estimatedPriceChf = String(data.estimated_price_chf ?? data.price)
    }
    if (data.condition !== undefined) productUpdate.condition = data.condition
    if (data.category !== undefined) productUpdate.category = data.category
    if (data.subcategory !== undefined) productUpdate.subcategory = data.subcategory
    if (data.status !== undefined) productUpdate.status = data.status

    if (Object.keys(productUpdate).length > 0) {
      productUpdate.updatedAt = sql`NOW()`
      await db
        .update(aiExtractedProducts)
        .set(productUpdate)
        .where(eq(aiExtractedProducts.id, params.id))
    }

    // Update inventory fields if provided
    const inventoryUpdate: Record<string, unknown> = {}
    if (data.quantity_available !== undefined) inventoryUpdate.quantityAvailable = data.quantity_available
    if (data.marketplace_status !== undefined) inventoryUpdate.marketplaceStatus = data.marketplace_status

    if (Object.keys(inventoryUpdate).length > 0) {
      await db
        .update(inventoryItems)
        .set(inventoryUpdate)
        .where(eq(inventoryItems.aiProductId, params.id))
    }

    logger.info("Product updated", { productId: params.id, user: session.user?.email })

    return apiSuccess({ productId: params.id })
  } catch (error) {
    logger.error("Failed to update product", { error, productId: context?.params?.id })
    return apiError(error, "Fehler beim Aktualisieren des Produkts")
  }
})

// DELETE /api/admin/products/[id] - Delete product
export const DELETE = withAdmin<{ id: string }>('products', async (
  request: NextRequest,
  session,
  context
) => {
  try {
    const params = context?.params
    if (!params?.id) {
      return apiError(new Error("Product ID required"), "Product ID required", 400)
    }

    // Delete inventory item first (foreign key)
    await db
      .delete(inventoryItems)
      .where(eq(inventoryItems.aiProductId, params.id))

    // Delete product
    const result = await db
      .delete(aiExtractedProducts)
      .where(eq(aiExtractedProducts.id, params.id))

    if (result.rowCount === 0) {
      return apiNotFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND)
    }

    logger.info("Product deleted", { productId: params.id, user: session.user?.email })

    return apiSuccess({ deleted: true })
  } catch (error) {
    logger.error("Failed to delete product", { error, productId: context?.params?.id })
    return apiError(error, "Fehler beim Löschen des Produkts")
  }
})
