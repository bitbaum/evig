import { db } from '@/db'
import {
  aiExtractedProducts,
  inventoryItems,
  listings,
} from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { LISTING_STATUS } from '@/config/marketplace'
import { ROUTES } from '@/config/routes'
import { logger } from '@/lib/logger'

/**
 * Resolve legacy /shop/product/:id bookmarks to a canonical marketplace listing.
 * Tries listing UUID, inventory item_uuid, then product id — falls back to browse.
 */
export async function resolveLegacyShopProductHref(rawId: string): Promise<string> {
  const id = rawId.trim()
  if (!id) return ROUTES.public.marketplace

  try {
    const [directListing] = await db
      .select({ id: listings.id })
      .from(listings)
      .where(and(eq(listings.id, id), eq(listings.status, LISTING_STATUS.ACTIVE)))
      .limit(1)

    if (directListing) {
      return ROUTES.public.marketplaceListing(directListing.id)
    }

    const [inventoryLink] = await db
      .select({ listingId: listings.id })
      .from(aiExtractedProducts)
      .innerJoin(inventoryItems, eq(inventoryItems.aiProductId, aiExtractedProducts.id))
      .innerJoin(listings, eq(listings.inventoryItemId, inventoryItems.id))
      .where(
        and(
          eq(listings.status, LISTING_STATUS.ACTIVE),
          eq(aiExtractedProducts.itemUuid, id),
        ),
      )
      .limit(1)

    if (inventoryLink) {
      return ROUTES.public.marketplaceListing(inventoryLink.listingId)
    }

    const [productLink] = await db
      .select({ listingId: listings.id })
      .from(aiExtractedProducts)
      .innerJoin(inventoryItems, eq(inventoryItems.aiProductId, aiExtractedProducts.id))
      .innerJoin(listings, eq(listings.inventoryItemId, inventoryItems.id))
      .where(
        and(
          eq(listings.status, LISTING_STATUS.ACTIVE),
          eq(aiExtractedProducts.id, id),
        ),
      )
      .limit(1)

    if (productLink) {
      return ROUTES.public.marketplaceListing(productLink.listingId)
    }
  } catch (error) {
    logger.warn('Legacy shop product redirect lookup failed', { error, id })
  }

  return ROUTES.public.marketplace
}
