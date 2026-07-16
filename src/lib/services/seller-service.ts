/**
 * Seller Service
 *
 * Shared select shapes for seller profile queries. The former seller
 * dashboard aggregation (getSellerDashboard) was removed with its dead
 * /api/seller/dashboard route — /dashboard/listings is the seller view.
 */

import { sellerProfiles, userProfiles } from '@/db/schema'

/**
 * Core seller profile fields returned by both GET /sellers/me and
 * GET /sellers/[id]. Spread into .select() or .returning() to avoid
 * repeating this shape in multiple routes.
 *
 * Route-specific extras (updated_at for /me, user_name for /[id]) are
 * added at the call site.
 *
 * Identity fields (display_name / bio / avatar_url / is_verified) come from
 * user_profiles — the SSOT (migration 121; the seller_profiles duplicates were
 * dropped in 122). Every query spreading this MUST
 * `.leftJoin(userProfiles, eq(sellerProfiles.userId, userProfiles.userId))`.
 * City/canton stay on seller_profiles (storefront location, a seller-facet fact).
 */
export const sellerProfileCoreFields = {
  id: sellerProfiles.id,
  user_id: sellerProfiles.userId,
  display_name: userProfiles.displayName,
  bio: userProfiles.bio,
  avatar_url: userProfiles.avatarUrl,
  city: sellerProfiles.city,
  canton: sellerProfiles.canton,
  is_verified: userProfiles.isVerified,
  average_rating: sellerProfiles.averageRating,
  total_reviews: sellerProfiles.totalReviews,
  total_listings: sellerProfiles.totalListings,
  total_sold: sellerProfiles.totalSold,
  created_at: sellerProfiles.createdAt,
} as const;
