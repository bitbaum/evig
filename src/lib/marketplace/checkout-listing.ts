import { db } from '@/db'
import { listings, listingImages, users, sellerProfiles } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { LISTING_STATUS } from '@/config/marketplace'
import type { ListingForCheckout } from '@/hooks/useCheckout'

/**
 * Server-side listing fetch for checkout — one round trip, no client waterfall.
 */
export async function getListingForCheckout(
  listingId: string,
): Promise<ListingForCheckout | null> {
  const revampitSellerCondition = sql`(${listings.isRevampit} = true OR lower(${users.email}) LIKE '%@revamp-it.ch' OR lower(${users.email}) LIKE '%@revampit.ch')`

  const [row] = await db
    .select({
      id: listings.id,
      title: listings.title,
      price_chf: listings.priceChf,
      delivery_options: listings.deliveryOptions,
      shipping_cost_chf: listings.shippingCostChf,
      payment_mode: listings.paymentMode,
      pickup_location: listings.pickupLocation,
      seller_name: users.name,
      seller_display_name: sellerProfiles.displayName,
      seller_id: listings.sellerId,
      is_revampit: revampitSellerCondition,
    })
    .from(listings)
    .innerJoin(users, eq(listings.sellerId, users.id))
    .leftJoin(sellerProfiles, eq(listings.sellerId, sellerProfiles.userId))
    .where(and(eq(listings.id, listingId), eq(listings.status, LISTING_STATUS.ACTIVE)))
    .limit(1)

  if (!row) return null

  const [primaryImage] = await db
    .select({ url: listingImages.url })
    .from(listingImages)
    .where(
      and(eq(listingImages.listingId, listingId), eq(listingImages.isPrimary, true)),
    )
    .limit(1)

  return {
    id: row.id,
    title: row.title,
    price_chf: Number(row.price_chf),
    delivery_options: row.delivery_options,
    shipping_cost_chf: row.shipping_cost_chf ? Number(row.shipping_cost_chf) : null,
    payment_mode: row.payment_mode,
    pickup_location: row.pickup_location,
    thumbnail: primaryImage?.url ?? null,
    seller_name: row.seller_display_name || row.seller_name || 'Verkäufer',
    seller_id: row.seller_id,
    is_revampit: Boolean(row.is_revampit),
  }
}
