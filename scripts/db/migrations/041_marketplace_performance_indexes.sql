-- =============================================================================
-- 041_marketplace_performance_indexes
-- Purpose: Add indexes for frequently queried marketplace columns
-- =============================================================================

-- Listing images: used in every listing query for thumbnail subquery
CREATE INDEX IF NOT EXISTS idx_listing_images_primary
  ON listing_images (listing_id, is_primary)
  WHERE is_primary = true;

-- Listing images: general lookup by listing
CREATE INDEX IF NOT EXISTS idx_listing_images_listing
  ON listing_images (listing_id, position);

-- Seller profiles: joined in all marketplace listing queries
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user
  ON seller_profiles (user_id);

-- Listing favorites: user's favorites lookup + composite uniqueness
CREATE INDEX IF NOT EXISTS idx_listing_favorites_user_listing
  ON listing_favorites (user_id, listing_id);

-- Reviews: filtered by target + type + status in review queries
CREATE INDEX IF NOT EXISTS idx_reviews_target_status
  ON reviews (target_id, target_type, status);

-- Listings: status filter (most queries filter by status = 'active')
CREATE INDEX IF NOT EXISTS idx_listings_status_created
  ON listings (status, created_at DESC)
  WHERE status = 'active';

-- Listings: seller lookup (used in /listings/mine, seller profiles)
CREATE INDEX IF NOT EXISTS idx_listings_seller
  ON listings (seller_id, status);

-- IT-Hilfe requests: status + expiry filter (every browse query)
CREATE INDEX IF NOT EXISTS idx_it_hilfe_requests_status_expires
  ON it_hilfe_requests (status, expires_at DESC)
  WHERE status = 'open';

-- IT-Hilfe requests: category filter
CREATE INDEX IF NOT EXISTS idx_it_hilfe_requests_category
  ON it_hilfe_requests (category_id, status);
