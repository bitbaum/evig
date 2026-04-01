/**
 * Shared Product Creation Logic
 *
 * SSOT for creating a product in the database.
 * Used by: single erfassung route, bulk-save route
 *
 * Extracted from app/api/admin/erfassung/route.ts to avoid duplication.
 */

import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { PRODUCT_STATUS, MARKETPLACE_STATUS } from '@/config/marketplace-status'
import { uploadImage, generateImageFilename } from '@/lib/storage/image-upload'
import {
  aiExtractedProducts,
  inventoryItems,
  customerProfiles,
  productCustomerProfiles,
  marketplaceListings,
  productImages,
} from '@/db/schema/inventory'
import type { ErfassungPayload } from '@/types/erfassung'
import type { PoolClient } from 'pg'

export interface CreateProductResult {
  productId: string
  itemUUID: string
  imageUrl: string | null
}

/** Drizzle db or transaction object — both share insert/select/execute */
type DbOrTx = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db

/** Check if value is a raw pg PoolClient (has .query but not .insert) */
function isPoolClient(v: unknown): v is PoolClient {
  return v != null && typeof (v as PoolClient).query === 'function' && !('insert' in (v as DbOrTx))
}

/**
 * Generate human-readable Item UUID in format I-YYMMDD-NNNN
 *
 * Accepts either a Drizzle tx/db or a raw PoolClient for backward compatibility
 * with callers that haven't been migrated yet.
 */
export async function generateItemUUID(executor?: DbOrTx | PoolClient): Promise<string> {
  const today = new Date()
  const datePart = today.toISOString().slice(2, 10).replace(/-/g, '')

  const tableName = getTableName(aiExtractedProducts)

  let count: string
  if (!executor) {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM ${aiExtractedProducts}
      WHERE DATE(created_at) = CURRENT_DATE
    `)
    count = (result.rows[0] as { count: string })?.count || '0'
  } else if (isPoolClient(executor)) {
    // Legacy PoolClient path (for callers not yet migrated to Drizzle)
    const result = await executor.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${tableName} WHERE DATE(created_at) = CURRENT_DATE`
    )
    count = result.rows[0]?.count || '0'
  } else {
    const result = await executor.execute(sql`
      SELECT COUNT(*) as count FROM ${aiExtractedProducts}
      WHERE DATE(created_at) = CURRENT_DATE
    `)
    count = (result.rows[0] as { count: string })?.count || '0'
  }

  const seqNum = parseInt(count) + 1
  const seqPart = seqNum.toString().padStart(4, '0')

  return `I-${datePart}-${seqPart}`
}

/**
 * Create a product in the database from an ErfassungPayload.
 *
 * Can be used standalone or within an existing Drizzle transaction.
 */
export async function createErfassungProduct(
  payload: ErfassungPayload,
  userId: string,
  tx: DbOrTx,
): Promise<CreateProductResult> {
  // Generate Item UUID within the transaction to prevent race conditions
  const itemUUID = await generateItemUUID(tx)

  // Build dimensions JSON
  const dimensions = {
    laenge_mm: payload.laenge_mm || null,
    breite_mm: payload.breite_mm || null,
    hoehe_mm: payload.hoehe_mm || null,
  }

  // Parse langtext if it's a string
  let specifications = {}
  if (payload.langtext) {
    try {
      specifications = typeof payload.langtext === 'string'
        ? JSON.parse(payload.langtext)
        : payload.langtext
    } catch {
      specifications = { raw: payload.langtext }
    }
  }

  // Determine status based on action (with legacy publish support)
  const action = payload.action || (payload.publish ? 'publish' : 'draft')
  const productStatus = action === 'draft' ? PRODUCT_STATUS.PENDING_REVIEW : PRODUCT_STATUS.APPROVED
  const marketplaceStatus = action === 'publish' ? MARKETPLACE_STATUS.PUBLISHED : MARKETPLACE_STATUS.DRAFT

  // 1. Insert into ai_extracted_products
  const [productRow] = await tx
    .insert(aiExtractedProducts)
    .values({
      itemUuid: itemUUID,
      productName: payload.produktname,
      brand: payload.hersteller,
      shortDescription: payload.kurzbeschreibung || null,
      specifications: specifications,
      estimatedPriceChf: String(payload.verkaufspreis),
      condition: payload.zustand || 'good',
      dimensions: dimensions,
      weightGrams: payload.gewicht_kg ? Math.round(payload.gewicht_kg * 1000) : null,
      category: payload.hauptkategorie || null,
      subcategory: payload.unterkategorie || null,
      status: productStatus,
      createdBy: userId,
    })
    .returning({ id: aiExtractedProducts.id })

  const productId = productRow.id

  // 2. Insert into inventory_items
  const [inventoryRow] = await tx
    .insert(inventoryItems)
    .values({
      aiProductId: productId,
      location: payload.location || null,
      boxId: payload.box_id || null,
      quantityAvailable: payload.auf_lager || 1,
      status: 'available',
      sellingPriceChf: String(payload.verkaufspreis),
      marketplaceStatus: marketplaceStatus,
    })
    .returning({ id: inventoryItems.id })

  const inventoryItemId = inventoryRow.id

  // 3. Link customer profiles if provided (batch to avoid N+1)
  if (payload.kundenprofile && payload.kundenprofile.length > 0) {
    const profileRows = await tx
      .select({ id: customerProfiles.id })
      .from(customerProfiles)
      .where(sql`${customerProfiles.slug} IN ${payload.kundenprofile}`)

    if (profileRows.length > 0) {
      await tx
        .insert(productCustomerProfiles)
        .values(
          profileRows.map((r) => ({
            productId: productId,
            profileId: r.id,
            assignedBy: 'manual' as const,
          }))
        )
        .onConflictDoNothing()
    }
  }

  // 4. Create marketplace listing if publishing to shop
  if (action === 'publish') {
    await tx
      .insert(marketplaceListings)
      .values({
        inventoryItemId: inventoryItemId,
        title: `${payload.hersteller} ${payload.produktname}`,
        description: payload.kurzbeschreibung || '',
        priceChf: String(payload.verkaufspreis),
        platform: 'internal',
        status: MARKETPLACE_STATUS.PUBLISHED,
        publishedAt: new Date().toISOString(),
        createdBy: userId,
      })
  }

  // 5. Handle image upload if provided
  let imageUrl: string | null = null
  if (payload.image) {
    const filename = generateImageFilename(itemUUID)
    const uploadResult = await uploadImage(payload.image, filename, 'products')

    if (uploadResult.success && uploadResult.url) {
      imageUrl = uploadResult.url

      await tx
        .insert(productImages)
        .values({
          productId: productId,
          filename: filename,
          filePath: uploadResult.url,
          isPrimary: true,
          uploadedBy: userId,
          uploadStatus: 'ready',
        })

      logger.info('Product image uploaded', {
        productId,
        itemUUID,
        imageUrl: uploadResult.url,
      })
    } else {
      logger.warn('Image upload failed, continuing without image', {
        productId,
        itemUUID,
        error: uploadResult.error,
      })
    }
  }

  return { productId, itemUUID, imageUrl }
}
