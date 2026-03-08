/**
 * Inventory Product Actions
 *
 * Business logic for inventory product management.
 * Extracted from API route to keep handlers thin.
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { uploadImage, deleteImage } from '@/lib/storage/image-upload'
import { logger } from '@/lib/logger'
import { PRODUCT_STATUS, MARKETPLACE_STATUS } from '@/config/marketplace-status'

// ─── Publish/Unpublish ─────────────────────────────────────────────

/**
 * Publish a product to the internal marketplace.
 * Creates or updates the marketplace listing.
 */
export async function publishProduct(productId: string, userId: string): Promise<void> {
  // Ensure product is approved
  await query(
    `UPDATE ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS}
     SET status = $2, updated_at = NOW()
     WHERE id = $1`,
    [productId, PRODUCT_STATUS.APPROVED]
  )

  // Get product info for listing
  const productInfo = await query<{
    brand: string
    product_name: string
    short_description: string | null
    estimated_price_chf: number
  }>(
    `SELECT brand, product_name, short_description, estimated_price_chf
     FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} WHERE id = $1`,
    [productId]
  )

  if (productInfo.rows.length === 0) return

  const p = productInfo.rows[0]

  // Get inventory item id
  const inventoryItem = await query<{ id: string }>(
    `SELECT id FROM ${TABLE_NAMES.INVENTORY_ITEMS} WHERE ai_product_id = $1`,
    [productId]
  )

  if (inventoryItem.rows.length === 0) return

  const inventoryItemId = inventoryItem.rows[0].id

  // Check if listing exists
  const existingListing = await query<{ id: string }>(
    `SELECT id FROM ${TABLE_NAMES.MARKETPLACE_LISTINGS}
     WHERE inventory_item_id = $1 AND platform = 'internal'`,
    [inventoryItemId]
  )

  if (existingListing.rows.length > 0) {
    await query(
      `UPDATE ${TABLE_NAMES.MARKETPLACE_LISTINGS}
       SET status = $2, published_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [existingListing.rows[0].id, MARKETPLACE_STATUS.PUBLISHED]
    )
  } else {
    await query(
      `INSERT INTO ${TABLE_NAMES.MARKETPLACE_LISTINGS} (
        inventory_item_id, title, description, price_chf,
        platform, status, published_at, created_by
      ) VALUES ($1, $2, $3, $4, 'internal', $6, NOW(), $5)`,
      [
        inventoryItemId,
        `${p.brand} ${p.product_name}`,
        p.short_description || '',
        p.estimated_price_chf,
        userId,
        MARKETPLACE_STATUS.PUBLISHED,
      ]
    )
  }

  logger.info('Product published', { productId, publishedBy: userId })
}

/**
 * Unpublish a product from the marketplace.
 */
export async function unpublishProduct(productId: string, userId: string): Promise<void> {
  await query(
    `UPDATE ${TABLE_NAMES.MARKETPLACE_LISTINGS}
     SET status = $2, updated_at = NOW()
     WHERE inventory_item_id = (
       SELECT id FROM ${TABLE_NAMES.INVENTORY_ITEMS} WHERE ai_product_id = $1
     )`,
    [productId, MARKETPLACE_STATUS.DRAFT]
  )

  logger.info('Product unpublished', { productId, unpublishedBy: userId })
}

// ─── Image Update ───────────────────────────────────────────────────

/**
 * Update the primary product image.
 * Handles upload, old image cleanup, and DB record upsert.
 *
 * @returns The new image URL, or null if upload failed
 */
export async function updateProductImage(
  productId: string,
  imageBase64: string,
  userId: string
): Promise<string | null> {
  // Get existing image
  const existingImage = await query<{ id: string; file_path: string }>(
    `SELECT id, file_path FROM ${TABLE_NAMES.PRODUCT_IMAGES}
     WHERE product_id = $1 AND is_primary = true`,
    [productId]
  )

  // Get item_uuid for filename
  const productInfo = await query<{ item_uuid: string }>(
    `SELECT item_uuid FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} WHERE id = $1`,
    [productId]
  )
  const itemUuid = productInfo.rows[0]?.item_uuid || productId

  const filename = `${itemUuid}.jpg`
  const uploadResult = await uploadImage(imageBase64, filename, 'products')

  if (!uploadResult.success || !uploadResult.url) {
    return null
  }

  // Delete old blob if applicable
  if (existingImage.rows.length > 0) {
    const oldUrl = existingImage.rows[0].file_path
    if (oldUrl.includes('blob.vercel-storage.com')) {
      await deleteImage(oldUrl)
    }

    await query(
      `UPDATE ${TABLE_NAMES.PRODUCT_IMAGES}
       SET file_path = $1, filename = $2, updated_at = NOW()
       WHERE id = $3`,
      [uploadResult.url, filename, existingImage.rows[0].id]
    )
  } else {
    await query(
      `INSERT INTO ${TABLE_NAMES.PRODUCT_IMAGES} (
        product_id, filename, file_path, is_primary, uploaded_by, upload_status
      ) VALUES ($1, $2, $3, true, $4, 'ready')`,
      [productId, filename, uploadResult.url, userId]
    )
  }

  logger.info('Product image updated', { productId, imageUrl: uploadResult.url })
  return uploadResult.url
}
