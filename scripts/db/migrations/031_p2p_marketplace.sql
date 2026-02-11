-- Migration: 031_p2p_marketplace
-- Description: P2P Marketplace - listings, images, favorites, orders
-- Replaces the old seller-application-gated flow with instant peer-to-peer listing

-- ============================================================================
-- 1. ALTER SELLER PROFILES FOR P2P
-- ============================================================================
-- Make existing required columns optional so profiles can be auto-created
-- with minimal data (just user_id + display_name)

ALTER TABLE seller_profiles
  ALTER COLUMN business_type DROP NOT NULL,
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN postal_code DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL;

-- Add P2P-specific columns (idempotent)
ALTER TABLE seller_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS canton TEXT,
  ADD COLUMN IF NOT EXISTS total_listings INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sold INTEGER DEFAULT 0;

-- ============================================================================
-- 2. LISTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Product info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_chf DECIMAL(10,2) NOT NULL CHECK (price_chf >= 0),
  category TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor', 'defect')),
  brand TEXT,
  model TEXT,

  -- Delivery
  delivery_options TEXT NOT NULL DEFAULT 'pickup' CHECK (delivery_options IN ('pickup', 'shipping', 'both')),
  shipping_cost_chf DECIMAL(10,2) CHECK (shipping_cost_chf IS NULL OR shipping_cost_chf >= 0),
  pickup_location TEXT,

  -- Payment
  payment_mode TEXT NOT NULL DEFAULT 'direct' CHECK (payment_mode IN ('secure', 'direct', 'both')),

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'reserved', 'draft', 'removed')),

  -- RevampIT inventory link (nullable — only for RevampIT's own stock)
  is_revampit BOOLEAN NOT NULL DEFAULT false,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,

  -- Denormalized counters
  view_count INTEGER NOT NULL DEFAULT 0,
  favorite_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- German full-text search on title + description + brand + model
CREATE INDEX IF NOT EXISTS idx_listings_fts
  ON listings
  USING GIN (to_tsvector('german', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(model, '')));

-- Partial composite index for active listings browse
CREATE INDEX IF NOT EXISTS idx_listings_active_browse
  ON listings (category, condition, created_at DESC)
  WHERE status = 'active';

-- Seller's own listings
CREATE INDEX IF NOT EXISTS idx_listings_seller
  ON listings (seller_id, status);

-- ============================================================================
-- 3. LISTING IMAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one primary image per listing
CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_images_primary
  ON listing_images (listing_id)
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_listing_images_listing
  ON listing_images (listing_id, position);

-- ============================================================================
-- 4. LISTING FAVORITES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS listing_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_favorites_user
  ON listing_favorites (user_id);

CREATE INDEX IF NOT EXISTS idx_listing_favorites_listing
  ON listing_favorites (listing_id);

-- ============================================================================
-- 5. MARKETPLACE ORDERS TABLE (secure payment mode only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,

  -- Financial
  amount_chf DECIMAL(10,2) NOT NULL CHECK (amount_chf > 0),
  commission_chf DECIMAL(10,2) NOT NULL CHECK (commission_chf >= 0),
  seller_payout_chf DECIMAL(10,2) NOT NULL,

  -- DB-enforced math: payout = amount - commission
  CONSTRAINT chk_payout_math CHECK (seller_payout_chf = amount_chf - commission_chf),

  -- Stripe
  stripe_payment_intent_id TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded')),

  -- Delivery
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('pickup', 'shipping')),
  shipping_address JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer
  ON marketplace_orders (buyer_id, status);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller
  ON marketplace_orders (seller_id, status);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_listing
  ON marketplace_orders (listing_id);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Auto-update updated_at on listings
CREATE OR REPLACE FUNCTION update_listing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_listings_updated_at ON listings;
CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_updated_at();

-- Auto-update updated_at on marketplace_orders
DROP TRIGGER IF EXISTS trg_marketplace_orders_updated_at ON marketplace_orders;
CREATE TRIGGER trg_marketplace_orders_updated_at
  BEFORE UPDATE ON marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_updated_at();

-- Auto-create seller_profile on first listing
CREATE OR REPLACE FUNCTION ensure_seller_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO seller_profiles (user_id, display_name)
  SELECT NEW.seller_id, u.name
  FROM users u
  WHERE u.id = NEW.seller_id
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_seller_profile ON listings;
CREATE TRIGGER trg_ensure_seller_profile
  BEFORE INSERT ON listings
  FOR EACH ROW
  EXECUTE FUNCTION ensure_seller_profile();

-- Update favorite_count on listings when favorites change
CREATE OR REPLACE FUNCTION update_listing_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE listings SET favorite_count = favorite_count + 1 WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE listings SET favorite_count = favorite_count - 1 WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_listing_favorite_insert ON listing_favorites;
CREATE TRIGGER trg_listing_favorite_insert
  AFTER INSERT ON listing_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_favorite_count();

DROP TRIGGER IF EXISTS trg_listing_favorite_delete ON listing_favorites;
CREATE TRIGGER trg_listing_favorite_delete
  AFTER DELETE ON listing_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_favorite_count();

-- Auto-mark listing as 'sold' when order is completed
CREATE OR REPLACE FUNCTION mark_listing_sold_on_order_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE listings SET status = 'sold' WHERE id = NEW.listing_id AND status != 'sold';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_complete_mark_sold ON marketplace_orders;
CREATE TRIGGER trg_order_complete_mark_sold
  AFTER UPDATE ON marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION mark_listing_sold_on_order_complete();

-- Update seller_profiles counters when listing status changes
CREATE OR REPLACE FUNCTION update_seller_listing_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT of new active listing, increment total_listings
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE seller_profiles SET total_listings = total_listings + 1 WHERE user_id = NEW.seller_id;
  -- On UPDATE: track transitions
  ELSIF TG_OP = 'UPDATE' THEN
    -- Became active
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
      UPDATE seller_profiles SET total_listings = total_listings + 1 WHERE user_id = NEW.seller_id;
    END IF;
    -- Left active
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE seller_profiles SET total_listings = GREATEST(total_listings - 1, 0) WHERE user_id = NEW.seller_id;
    END IF;
    -- Became sold
    IF NEW.status = 'sold' AND OLD.status != 'sold' THEN
      UPDATE seller_profiles SET total_sold = total_sold + 1 WHERE user_id = NEW.seller_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_seller_listing_counts ON listings;
CREATE TRIGGER trg_seller_listing_counts
  AFTER INSERT OR UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_listing_counts();

-- ============================================================================
-- 7. EXTEND REVIEW TARGET TYPES
-- ============================================================================
-- The reviews table uses a CHECK constraint on target_type.
-- Add 'listing' as a valid target type if the table exists.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) THEN
    -- Drop old constraint and recreate with 'listing' added
    ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_target_type_check;
    ALTER TABLE reviews ADD CONSTRAINT reviews_target_type_check
      CHECK (target_type IN ('repairer', 'service', 'workshop', 'it_hilfe', 'listing'));
  END IF;
END $$;
