/**
 * Listing-detail view types.
 *
 * The shapes live in the server data layer (SSOT) so the API route, the server
 * page, and these client components all agree. Re-exported here so the existing
 * `./types` imports in this folder keep working.
 */
export type {
  ListingImageData,
  ListingDetail,
  ListingPublic,
  SimilarListing,
  ListingReviewStats,
} from '@/lib/marketplace/listing-detail'
