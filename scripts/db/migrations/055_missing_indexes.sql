-- Migration 055: Add missing indexes for common query patterns
--
-- These columns are frequently filtered/sorted but lack indexes:
-- - listings.verified_at (IS NOT NULL filter for verified listings)
-- - listings.price_chf (range filters)
-- - users(is_staff, created_at) (admin user listing with sort)

-- Listings: verified filter
CREATE INDEX IF NOT EXISTS idx_listings_verified_at ON listings (verified_at)
  WHERE verified_at IS NOT NULL;

-- Listings: price range filter
CREATE INDEX IF NOT EXISTS idx_listings_price_chf ON listings (price_chf);

-- Users: staff listing sorted by join date
CREATE INDEX IF NOT EXISTS idx_users_staff_created ON users (is_staff, created_at DESC)
  WHERE is_staff = true;
