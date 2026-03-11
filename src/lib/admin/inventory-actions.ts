/**
 * Inventory Product Actions
 *
 * Business logic for inventory product management.
 * Extracted from API route to keep handlers thin.
 */

import { db } from '@/db'
import { aiExtractedProducts, inventoryItems, marketplaceListings, productImages } from '@/db/schema/inventory'
import { eq, and } from 'drizzle-orm'
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
  await db
    .update(aiExtractedProducts)
    .set({ status: PRODUCT_STATUS.APPROVED, updatedAt: new Date().toISOString() })
    .where(eq(aiExtractedProducts.id, productId))

  // Get product info for listing
  const [productInfo] = await db
    .select({
      brand: aiExtractedProducts.brand,
      productName: aiExtractedProducts.productName,
      shortDescription: aiExtractedProducts.shortDescription,
      estimatedPriceChf: aiExtractedProducts.estimatedPriceChf,
    })
    .from(aiExtractedProducts)
    .where(eq(aiExtractedProducts.id, productId))

  if (!productInfo) return

  // Get inventory item id
  const [inventoryItem] = await db
    .select({ id: inventoryItems.id })
    .from(inventoryItems)
    .where(eq(inventoryItems.aiProductId, productId))

  if (!inventoryItem) return

  const inventoryItemId = inventoryItem.id

  // Check if listing exists
  const [existingListing] = await db
    .select({ id: marketplaceListings.id })
    .from(marketplaceListings)
    .where(
      and(
        eq(marketplaceListings.inventoryItemId, inventoryItemId),
        eq(marketplaceListings.platform, 'internal'),
      )
    )

  if (existingListing) {
    await db
      .update(marketplaceListings)
      .set({
        status: MARKETPLACE_STATUS.PUBLISHED,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(marketplaceListings.id, existingListing.id))
  } else {
    await db.insert(marketplaceListings).values({
      inventoryItemId,
      title: `${productInfo.brand} ${productInfo.productName}`,
      description: productInfo.shortDescription || '',
      priceChf: productInfo.estimatedPriceChf || '0',
      platform: 'internal',
      status: MARKETPLACE_STATUS.PUBLISHED,
      publishedAt: new Date().toISOString(),
      createdBy: userId,
    })
  }

  logger.info('Product published', { productId, publishedBy: userId })
}

/**
 * Unpublish a product from the marketplace.
 */
export async function unpublishProduct(productId: string, userId: string): Promise<void> {
  // Find the inventory item for this product
  const [inventoryItem] = await db
    .select({ id: inventoryItems.id })
    .from(inventoryItems)
    .where(eq(inventoryItems.aiProductId, productId))

  if (inventoryItem) {
    await db
      .update(marketplaceListings)
      .set({ status: MARKETPLACE_STATUS.DRAFT, updatedAt: new Date().toISOString() })
      .where(eq(marketplaceListings.inventoryItemId, inventoryItem.id))
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

  // Delete old blob if applicable
  if (existingImage) {
    const oldUrl = existingImage.filePath
    if (oldUrl.includes('blob.vercel-storage.com')) {
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
