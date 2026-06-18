/**
 * Inventory Product Actions
 *
 * Business logic for inventory product management.
 * Extracted from API route to keep handlers thin.
 */

import { db } from '@/db'
import { aiExtractedProducts, inventoryItems, productImages } from '@/db/schema/inventory'
import { eq, and } from 'drizzle-orm'
import { uploadImage, deleteImage } from '@/lib/storage/image-upload'
import { logger } from '@/lib/logger'
import { PRODUCT_STATUS } from '@/config/marketplace-status'
import { publishRevampitListing, unpublishRevampitListing } from '@/lib/marketplace/publish-revampit-listing'

// ─── Publish/Unpublish ─────────────────────────────────────────────

/**
 * Publish a product to the internal marketplace.
 * Creates or updates the marketplace listing.
 */
export async function publishProduct(productId: string, userId: string): Promise<void> {
  // Ensure product is approved
  await db
    .update(aiExtractedProducts)
    .set({ status: PRODUCT_STATUS.APPROVED, updatedAt: new Date().toISOString() })
    .where(eq(aiExtractedProducts.id, productId))

  const [inventoryItem] = await db
    .select({ id: inventoryItems.id })
    .from(inventoryItems)
    .where(eq(inventoryItems.aiProductId, productId))

  if (!inventoryItem) return

  // Publish to the unified marketplace as a RevampIT listing.
  await publishRevampitListing(db, inventoryItem.id)
  logger.info('Product published', { productId, publishedBy: userId })
}

/**
 * Unpublish a product from the marketplace.
 */
export async function unpublishProduct(productId: string, userId: string): Promise<void> {
  const [inventoryItem] = await db
    .select({ id: inventoryItems.id })
    .from(inventoryItems)
    .where(eq(inventoryItems.aiProductId, productId))

  if (inventoryItem) {
    await unpublishRevampitListing(db, inventoryItem.id)
  }

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
  const [existingImage] = await db
    .select({ id: productImages.id, filePath: productImages.filePath })
    .from(productImages)
    .where(and(eq(productImages.productId, productId), eq(productImages.isPrimary, true)))

  // Get item_uuid for filename
  const [productInfo] = await db
    .select({ itemUuid: aiExtractedProducts.itemUuid })
    .from(aiExtractedProducts)
    .where(eq(aiExtractedProducts.id, productId))

  const itemUuid = productInfo?.itemUuid || productId

  const filename = `${itemUuid}.jpg`
  const uploadResult = await uploadImage(imageBase64, filename, 'products')

  if (!uploadResult.success || !uploadResult.url) {
    return null
  }

  // Clean up the previous object only when the new upload landed at a different
  // URL. Filenames are deterministic (<itemUuid>.jpg) so re-uploads usually
  // overwrite in place (no-op here); this handles the rarer differing-key case.
  // deleteImage() handles both the S3/Hetzner and local-fs backends.
  // (Replaces a dead check for blob.vercel-storage.com — Vercel Blob is gone.)
  if (existingImage) {
    const oldUrl = existingImage.filePath
    if (oldUrl && oldUrl !== uploadResult.url) {
      await deleteImage(oldUrl)
    }

    await db
      .update(productImages)
      .set({ filePath: uploadResult.url, filename, updatedAt: new Date().toISOString() })
      .where(eq(productImages.id, existingImage.id))
  } else {
    await db.insert(productImages).values({
      productId,
      filename,
      filePath: uploadResult.url,
      isPrimary: true,
      uploadedBy: userId,
      uploadStatus: 'ready',
    })
  }

  logger.info('Product image updated', { productId, imageUrl: uploadResult.url })
  return uploadResult.url
}
