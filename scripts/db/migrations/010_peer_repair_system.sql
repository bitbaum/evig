-- ============================================================================
-- Migration 010: Peer Repair Marketplace System
--
-- "Uber for repairs" - community members post repair requests, others offer to help
-- Extends RevampIT's mission of reducing e-waste through peer-to-peer hardware repair
-- ============================================================================

-- ============================================================================
-- Table: peer_repair_requests
-- What needs fixing - posted by community members seeking help
-- ============================================================================
CREATE TABLE IF NOT EXISTS peer_repair_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Device details
  category_id VARCHAR(50) NOT NULL,           -- laptop, smartphone, desktop, etc.
  device_brand VARCHAR(100),
  device_model VARCHAR(200),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,

  -- Request parameters
  urgency VARCHAR(20) DEFAULT 'normal',       -- low, normal, high, urgent
  budget_type VARCHAR(20) NOT NULL,           -- free, donation, fixed, hourly
  budget_amount_cents INTEGER,                -- NULL for free/donation

  -- Location (Swiss postal code system)
  postal_code VARCHAR(10) NOT NULL,
  city VARCHAR(100) NOT NULL,
  canton VARCHAR(50) NOT NULL,

  -- Service preferences
  service_type VARCHAR(20) DEFAULT 'flexible', -- pickup, dropoff, onsite, remote
  skills_needed TEXT[],                        -- Array of skill IDs needed
  image_urls TEXT[],                           -- Photos of the device/problem

  -- Status tracking
  status VARCHAR(30) DEFAULT 'open',           -- open, in_discussion, matched, completed, cancelled
  matched_offer_id UUID,                       -- Which offer was accepted
  offer_count INTEGER DEFAULT 0,               -- Cached count of offers

  -- Timestamps
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Table: peer_repair_offers
-- Help offered by community members to repair requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS peer_repair_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES peer_repair_requests(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Offer details
  message TEXT NOT NULL,                       -- Helper's message to requester
  estimated_time VARCHAR(50),                  -- e.g., "1-2 Stunden", "1 Tag"
  proposed_compensation VARCHAR(100),          -- e.g., "Kostenlos", "CHF 30", "Spende willkommen"
  relevant_skills TEXT[],                      -- Skills the helper brings

  -- Status
  status VARCHAR(20) DEFAULT 'pending',        -- pending, accepted, rejected, withdrawn

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only make one offer per request
  CONSTRAINT unique_offer_per_user_request UNIQUE(request_id, helper_id)
);

-- ============================================================================
-- Indexes for performance
-- ============================================================================

-- Request lookups
CREATE INDEX IF NOT EXISTS idx_peer_repair_requests_requester_id
ON peer_repair_requests(requester_id);

CREATE INDEX IF NOT EXISTS idx_peer_repair_requests_status
ON peer_repair_requests(status);

CREATE INDEX IF NOT EXISTS idx_peer_repair_requests_category
ON peer_repair_requests(category_id);

CREATE INDEX IF NOT EXISTS idx_peer_repair_requests_postal_code
ON peer_repair_requests(postal_code);

CREATE INDEX IF NOT EXISTS idx_peer_repair_requests_canton
ON peer_repair_requests(canton);

CREATE INDEX IF NOT EXISTS idx_peer_repair_requests_created
ON peer_repair_requests(created_at DESC);

-- Compound index for browsing (status + location + time)
CREATE INDEX IF NOT EXISTS idx_peer_repair_requests_browse
ON peer_repair_requests(status, canton, created_at DESC);

-- Offer lookups
CREATE INDEX IF NOT EXISTS idx_peer_repair_offers_request_id
ON peer_repair_offers(request_id);

CREATE INDEX IF NOT EXISTS idx_peer_repair_offers_helper_id
ON peer_repair_offers(helper_id);

CREATE INDEX IF NOT EXISTS idx_peer_repair_offers_status
ON peer_repair_offers(status);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at timestamp on requests
CREATE OR REPLACE FUNCTION update_peer_repair_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_peer_repair_request_timestamp ON peer_repair_requests;

CREATE TRIGGER trigger_update_peer_repair_request_timestamp
    BEFORE UPDATE ON peer_repair_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_peer_repair_request_timestamp();

-- Auto-increment/decrement offer_count on requests when offers are added/removed
CREATE OR REPLACE FUNCTION update_peer_repair_offer_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE peer_repair_requests
        SET offer_count = offer_count + 1
        WHERE id = NEW.request_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE peer_repair_requests
        SET offer_count = offer_count - 1
        WHERE id = OLD.request_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_peer_repair_offer_count ON peer_repair_offers;

CREATE TRIGGER trigger_update_peer_repair_offer_count
    AFTER INSERT OR DELETE ON peer_repair_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_peer_repair_offer_count();

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE peer_repair_requests IS 'Peer-to-peer repair requests from community members seeking help';
COMMENT ON TABLE peer_repair_offers IS 'Offers from community helpers to repair requests';

COMMENT ON COLUMN peer_repair_requests.category_id IS 'Device category (laptop, smartphone, etc.)';
COMMENT ON COLUMN peer_repair_requests.urgency IS 'Request urgency: low, normal, high, urgent';
COMMENT ON COLUMN peer_repair_requests.budget_type IS 'Compensation type: free, donation, fixed, hourly';
COMMENT ON COLUMN peer_repair_requests.service_type IS 'Service delivery: pickup, dropoff, onsite, remote, flexible';
COMMENT ON COLUMN peer_repair_requests.skills_needed IS 'Array of skill IDs from peer-repairs config';
COMMENT ON COLUMN peer_repair_requests.matched_offer_id IS 'Accepted offer ID, set when status becomes matched';
COMMENT ON COLUMN peer_repair_requests.offer_count IS 'Cached count of offers (auto-updated by trigger)';

COMMENT ON COLUMN peer_repair_offers.relevant_skills IS 'Skills the helper brings to this repair';
COMMENT ON COLUMN peer_repair_offers.status IS 'Offer status: pending, accepted, rejected, withdrawn';
