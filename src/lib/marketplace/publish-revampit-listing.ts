/**
 * Publish a RevampIT inventory item as a marketplace `listings` row.
 *
 * SSOT for turning RevampIT shop stock into a unified-marketplace listing.
 * Used by: erfassung publish (create-product.ts), intake publish, the manual
 * publish action, and the one-time backfill. Replaces the old
 * marketplace_listings insert — RevampIT products now live in `listings`
 * (is_revampit=true, inventory_item_id set), so they appear in /marketplace,
 * are searchable, and are buyable via the existing order/checkout flow.
 *
 * inventory_items stays the stock system of record (quantity, box, kivvi,
 * intake checklist); a listings row is just its public marketplace face. The
 * helper reads everything it needs from the inventory item -> product ->
 * primary image, so callers only pass the inventory item id (+ optional price).
 */
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { listings, listingImages } from '@/db/schema/marketplace'
import { users } from '@/db/schema/auth'
import { aiExtractedProducts, inventoryItems, productImages } from '@/db/schema/inventory'
import { indexListingInSearch } from '@/lib/marketplace/listing-helpers'
import { removeListing } from '@/lib/search/meilisearch'
import {
  MARKETPLACE_CATEGORY_VALUES,
  LISTING_CONDITIONS,
  LISTING_STATUS,
  REVAMPIT_LISTING_DELIVERY,
} from '@/config/marketplace'
import { logger } from '@/lib/logger'

/** Drizzle db or transaction object. */
type DbOrTx = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db

/**
 * The RevampIT system seller. A non-login account (no passwordHash) that owns
 * every is_revampit listing, so the org appears as a single seller. The
 * is_revampit flag — not this account's role — is what badges the listing.
 */
export const REVAMPIT_SELLER_EMAIL = 'shop@revamp-it.ch'
export const REVAMPIT_SELLER_NAME = 'Revamp-IT'

const CATEGORY_FALLBACK = '99' // "Sonstiges"
const CONDITION_FALLBACK = 'good'

function mapCategory(category: string | null | undefined): string {
  return category && (MARKETPLACE_CATEGORY_VALUES as readonly string[]).includes(category)
    ? category
    : CATEGORY_FALLBACK
}

function mapCondition(condition: string | null | undefined): string {
  return condition && (LISTING_CONDITIONS as readonly string[]).includes(condition)
    ? condition
    : CONDITION_FALLBACK
}

/** Get-or-create the RevampIT system seller user; returns its id. */
export async function getRevampitSellerId(tx: DbOrTx): Promise<string> {
  const existing = await tx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, REVAMPIT_SELLER_EMAIL))
    .limit(1)

  if (existing[0]) return existing[0].id

  const [created] = await tx
    .insert(users)
    .values({ email: REVAMPIT_SELLER_EMAIL, name: REVAMPIT_SELLER_NAME, isStaff: false })
    .returning({ id: users.id })

  return created.id
}

/**
 * Create or refresh the marketplace listing for a RevampIT inventory item.
 * Idempotent per inventory item (one listing each), so it is safe on
 * re-publish and during backfill. Reads title/desc/price/category/condition/
 * image from the inventory item's product. Returns the listing id, or null if
 * the inventory item / product can't be found.
 */
export async function publishRevampitListing(
  tx: DbOrTx,
  inventoryItemId: string,
  opts?: { priceChf?: string | number; title?: string; description?: string },
): Promise<string | null> {
  const [data] = await tx
    .select({
      productId: aiExtractedProducts.id,
      brand: aiExtractedProducts.brand,
      productName: aiExtractedProducts.productName,
      shortDescription: aiExtractedProducts.shortDescription,
      category: aiExtractedProducts.category,
      condition: aiExtractedProducts.condition,
      estimatedPriceChf: aiExtractedProducts.estimatedPriceChf,
      sellingPriceChf: inventoryItems.sellingPriceChf,
    })
    .from(inventoryItems)
    .innerJoin(aiExtractedProducts, eq(inventoryItems.aiProductId, aiExtractedProducts.id))
    .where(eq(inventoryItems.id, inventoryItemId))
    .limit(1)

  if (!data) {
    logger.warn('publishRevampitListing: inventory item not found', { inventoryItemId })
    return null
  }

  const [img] = await tx
    .select({ filePath: productImages.filePath })
    .from(productImages)
    .where(and(eq(productImages.productId, data.productId), eq(productImages.isPrimary, true)))
    .limit(1)
  const imageUrl = img?.filePath ?? null

  const sellerId = await getRevampitSellerId(tx)
  const title =
    opts?.title?.trim() ||
    `${data.brand ?? ''} ${data.productName ?? ''}`.trim() ||
    (data.productName ?? 'Produkt')
  const description = opts?.description ?? data.shortDescription ?? ''
  const category = mapCategory(data.category)
  const condition = mapCondition(data.condition)
  const priceChf = String(opts?.priceChf ?? data.sellingPriceChf ?? data.estimatedPriceChf ?? '0')
  const nowIso = new Date().toISOString()

  const existing = await tx
    .select({ id: listings.id })
    .from(listings)
    .where(eq(listings.inventoryItemId, inventoryItemId))
    .limit(1)

  let listingId: string
  if (existing[0]) {
    listingId = existing[0].id
    await tx
      .update(listings)
      .set({
        title,
        description,
        priceChf,
        category,
        condition,
        brand: data.brand ?? null,
        model: data.productName ?? null,
        status: LISTING_STATUS.ACTIVE,
        updatedAt: nowIso,
      })
      .where(eq(listings.id, listingId))
  } else {
    const [row] = await tx
      .insert(listings)
      .values({
        sellerId,
        isRevampit: true,
        inventoryItemId,
        title,
        description,
        priceChf,
        category,
        condition,
        brand: data.brand ?? null,
        model: data.productName ?? null,
        deliveryOptions: REVAMPIT_LISTING_DELIVERY.options,
        shippingCostChf: REVAMPIT_LISTING_DELIVERY.shippingCostChf,
        pickupLocation: REVAMPIT_LISTING_DELIVERY.pickupLocation,
        paymentMode: 'secure',
        status: LISTING_STATUS.ACTIVE,
      })
      .returning({ id: listings.id })
    listingId = row.id
  }

  if (imageUrl) {
    const hasImage = await tx
      .select({ id: listingImages.id })
      .from(listingImages)
      .where(eq(listingImages.listingId, listingId))
      .limit(1)
    if (!hasImage[0]) {
      await tx.insert(listingImages).values({ listingId, url: imageUrl, position: 0, isPrimary: true })
    }
  }

  indexListingInSearch({
    id: listingId,
    title,
    description,
    brand: data.brand ?? null,
    model: data.productName ?? null,
    category,
    condition,
    price_chf: Number(priceChf),
    delivery_options: REVAMPIT_LISTING_DELIVERY.options,
    payment_mode: 'secure',
    status: LISTING_STATUS.ACTIVE,
    is_revampit: true,
    is_verified: false,
    pickup_location: REVAMPIT_LISTING_DELIVERY.pickupLocation,
    seller_name: REVAMPIT_SELLER_NAME,
    seller_city: null,
    view_count: 0,
    favorite_count: 0,
    created_at: nowIso,
    thumbnail: imageUrl,
  })

  logger.info('Published RevampIT listing', { listingId, inventoryItemId })
  return listingId
}

/**
 * Remove a RevampIT inventory item's listing from the live marketplace
 * (status -> removed + drop from search). Used by unpublish/delete.
 */
export async function unpublishRevampitListing(tx: DbOrTx, inventoryItemId: string): Promise<void> {
  const rows = await tx
    .update(listings)
    .set({ status: LISTING_STATUS.REMOVED, updatedAt: new Date().toISOString() })
    .where(eq(listings.inventoryItemId, inventoryItemId))
    .returning({ id: listings.id })
  for (const row of rows) removeListing(row.id)
}
