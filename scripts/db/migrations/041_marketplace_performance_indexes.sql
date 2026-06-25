-- =============================================================================
-- 041_marketplace_performance_indexes
-- Purpose: Add indexes for frequently queried marketplace columns
-- Idempotent: skip indexes when target table/column missing (fresh vs prod drift).
-- =============================================================================

DO $$
BEGIN
  IF to_regclass('public.listing_images') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_listing_images_primary
      ON listing_images (listing_id, is_primary)
      WHERE is_primary = true;

    CREATE INDEX IF NOT EXISTS idx_listing_images_listing
      ON listing_images (listing_id, position);
  END IF;

  IF to_regclass('public.seller_profiles') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_seller_profiles_user
      ON seller_profiles (user_id);
  END IF;

  IF to_regclass('public.listing_favorites') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_listing_favorites_user_listing
      ON listing_favorites (user_id, listing_id);
  END IF;

  IF to_regclass('public.reviews') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_reviews_target_status
      ON reviews (target_id, target_type, status);
  END IF;

  IF to_regclass('public.listings') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_listings_status_created
      ON listings (status, created_at DESC)
      WHERE status = 'active';

    CREATE INDEX IF NOT EXISTS idx_listings_seller
      ON listings (seller_id, status);
  END IF;

  IF to_regclass('public.it_hilfe_requests') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_it_hilfe_requests_status_expires
      ON it_hilfe_requests (status, expires_at DESC)
      WHERE status = 'open';

    CREATE INDEX IF NOT EXISTS idx_it_hilfe_requests_category
      ON it_hilfe_requests (category_id, status);
  END IF;
END $$;
