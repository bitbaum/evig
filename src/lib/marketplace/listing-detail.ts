/**
 * Listing detail — server data layer (SSOT for the public listing-detail shape).
 *
 * Both the API route (GET /api/listings/[id]) and the server-rendered detail
 * page (app/[locale]/marketplace/[id]/page.tsx) resolve a listing through here,
 * so the query lives in exactly one place. The public fetch is wrapped in
 * React `cache()` so a server render can call it from both `generateMetadata`
 * and the page body without hitting the DB twice.
 *
 * `is_favorited` is viewer-specific and therefore NOT part of the cached public
 * fetch — callers overlay it via `isListingFavorited`.
 */

import { cache as reactCache } from 'react'
import { db } from '@/db'

// `React.cache` only exists in the RSC runtime; fall back to identity in plain
// Node contexts (jest) so importing this module doesn't throw. Dedup is a
// server-render optimisation, not a correctness requirement.
const cache: typeof reactCache =
  typeof reactCache === 'function' ? reactCache : (<T,>(fn: T): T => fn) as typeof reactCache
import {
  listings,
  listingImages,
  listingSpecs,
  listingFavorites,
  reviews,
  users,
  sellerProfiles,
  userProfiles,
} from '@/db/schema'
import { eq, and, ne, asc, sql } from 'drizzle-orm'
import { LISTING_STATUS } from '@/config/marketplace'
import { REVIEW_TARGET_TYPES } from '@/config/database'
import { REVIEW_STATUS } from '@/config/review-status'
import { logger } from '@/lib/logger'

export interface ListingImageData {
  id: string
  url: string
  position: number
  is_primary: boolean
}

export interface ListingDetail {
  id: string
  seller_id: string
  title: string
  description: string
  price_chf: number
  category: string
  condition: string
  brand: string | null
  model: string | null
  delivery_options: string
  shipping_cost_chf: number | null
  pickup_location: string | null
  payment_mode: string
  status: string
  is_revampit: boolean
  view_count: number
  favorite_count: number
  created_at: string
  seller_name: string | null
  seller_display_name: string | null
  seller_bio: string | null
  seller_avatar_url: string | null
  seller_city: string | null
  seller_canton: string | null
  seller_rating: number | null
  seller_total_sold: number | null
  seller_total_reviews: number | null
  images: ListingImageData[]
  is_favorited: boolean
  verified_at: string | null
  verified_by: string | null
  verification_notes: string | null
  condition_checks: Array<{ key: string; label: string; checked: boolean }> | null
  specs: Array<{ key: string; value: string; unit: string | null }> | null
}

/** The publicly-cacheable shape — everything except the viewer-specific favourite flag. */
export type ListingPublic = Omit<ListingDetail, 'is_favorited'>

export interface SimilarListing {
  id: string
  title: string
  price_chf: number
  condition: string
  thumbnail: string | null
}

export interface ListingReviewStats {
  average: number
  count: number
}

/**
 * Public listing detail (no viewer context). Cached per request so
 * `generateMetadata` and the page body share a single DB round-trip.
 * Returns null for a missing or removed listing.
 */
export const getListingDetail = cache(async (id: string): Promise<ListingPublic | null> => {
  const [listing] = await db
    .select({
      id: listings.id,
      seller_id: listings.sellerId,
      title: listings.title,
      description: listings.description,
      price_chf: listings.priceChf,
      category: listings.category,
      condition: listings.condition,
      brand: listings.brand,
      model: listings.model,
      delivery_options: listings.deliveryOptions,
      shipping_cost_chf: listings.shippingCostChf,
      pickup_location: listings.pickupLocation,
      payment_mode: listings.paymentMode,
      status: listings.status,
      // SSOT: the stored column; never re-derive from email.
      is_revampit: listings.isRevampit,
      view_count: listings.viewCount,
      favorite_count: listings.favoriteCount,
      created_at: listings.createdAt,
      verified_at: listings.verifiedAt,
      verified_by: listings.verifiedBy,
      verification_notes: listings.verificationNotes,
      condition_checks: listings.conditionChecks,
      seller_name: users.name,
      // Identity (display_name/bio/avatar) from user_profiles SSOT; city/canton
      // stay on seller_profiles (storefront location).
      seller_display_name: userProfiles.displayName,
      seller_bio: userProfiles.bio,
      seller_avatar_url: userProfiles.avatarUrl,
      seller_city: sellerProfiles.city,
      seller_canton: sellerProfiles.canton,
      seller_rating: sellerProfiles.averageRating,
      seller_total_sold: sellerProfiles.totalSold,
      seller_total_reviews: sellerProfiles.totalReviews,
    })
    .from(listings)
    .innerJoin(users, eq(listings.sellerId, users.id))
    .leftJoin(sellerProfiles, eq(listings.sellerId, sellerProfiles.userId))
    .leftJoin(userProfiles, eq(listings.sellerId, userProfiles.userId))
    .where(and(eq(listings.id, id), ne(listings.status, LISTING_STATUS.REMOVED)))

  if (!listing) return null

  const [images, specs] = await Promise.all([
    db
      .select({
        id: listingImages.id,
        url: listingImages.url,
        position: listingImages.position,
        is_primary: listingImages.isPrimary,
      })
      .from(listingImages)
      .where(eq(listingImages.listingId, id))
      .orderBy(asc(listingImages.position)),
    db
      .select({
        spec_key: listingSpecs.specKey,
        spec_value: listingSpecs.specValue,
        spec_unit: listingSpecs.specUnit,
        normalized_value: listingSpecs.normalizedValue,
      })
      .from(listingSpecs)
      .where(eq(listingSpecs.listingId, id))
      .orderBy(asc(listingSpecs.specKey)),
  ])

  // Drizzle returns decimal columns as strings; the ListingPublic contract is
  // numeric (consumers already Number()-wrap defensively). Coerce here so the
  // shape honestly matches its type instead of carrying the old string lie.
  return {
    ...listing,
    price_chf: Number(listing.price_chf),
    shipping_cost_chf: listing.shipping_cost_chf != null ? Number(listing.shipping_cost_chf) : null,
    seller_rating: listing.seller_rating != null ? Number(listing.seller_rating) : null,
    // condition_checks is untyped jsonb at the DB boundary; its shape is
    // enforced at the write boundary, so assert it here.
    condition_checks: listing.condition_checks as ListingPublic['condition_checks'],
    images,
    specs: specs.map((s) => ({ key: s.spec_key, value: s.spec_value, unit: s.spec_unit })),
  }
})

/** Whether a given viewer has favourited this listing. */
export async function isListingFavorited(viewerId: string, id: string): Promise<boolean> {
  const rows = await db
    .select({ id: listingFavorites.id })
    .from(listingFavorites)
    .where(and(eq(listingFavorites.userId, viewerId), eq(listingFavorites.listingId, id)))
  return rows.length > 0
}

/** Fire-and-forget view-count bump — only counts ACTIVE listings, like the API. */
export function incrementListingView(id: string): void {
  db.update(listings)
    .set({ viewCount: sql`${listings.viewCount} + 1` })
    .where(and(eq(listings.id, id), eq(listings.status, LISTING_STATUS.ACTIVE)))
    .catch((err) => logger.error('Failed to increment view count', { error: err, listingId: id }))
}

/**
 * Listing-scoped published-review aggregate, for the JSON-LD AggregateRating.
 * Returns count 0 when the listing has no reviews (caller omits AggregateRating).
 */
export async function getListingReviewStats(id: string): Promise<ListingReviewStats> {
  const [row] = await db
    .select({
      avg: sql<string | null>`ROUND(AVG(${reviews.overallRating})::numeric, 2)`,
      count: sql<string>`COUNT(*)`,
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.targetType, REVIEW_TARGET_TYPES.LISTING),
        eq(reviews.targetId, id),
        eq(reviews.status, REVIEW_STATUS.PUBLISHED),
      ),
    )
  return {
    average: row?.avg ? Number(row.avg) : 0,
    count: row?.count ? Number(row.count) : 0,
  }
}
