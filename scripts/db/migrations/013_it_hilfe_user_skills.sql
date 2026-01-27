-- ============================================================================
-- IT-Hilfe User Skills System
-- Migration: 013_it_hilfe_user_skills.sql
--
-- Creates tables for:
-- 1. user_skills - Skills that users can offer
-- 2. helper_profiles - Optional profile for users offering IT help
-- 3. Renames peer_repair_* tables to it_hilfe_* tables
-- ============================================================================

-- ============================================================================
-- User Skills Table
-- Stores which IT skills a user has and can offer to help others
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id VARCHAR(50) NOT NULL,
  category_id VARCHAR(50) NOT NULL,
  -- Verification by community/staff
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate skill entries per user
  UNIQUE(user_id, skill_id)
);

-- Indexes for efficient skill searches
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_category_id ON user_skills(category_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_verified ON user_skills(verified) WHERE verified = true;

-- ============================================================================
-- Helper Profiles Table
-- Optional profile for users who want to offer IT help services
-- ============================================================================
CREATE TABLE IF NOT EXISTS helper_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Profile information
  bio TEXT,
  avatar_url TEXT,

  -- Pricing (optional - helpers can also offer free help)
  hourly_rate_cents INTEGER,
  accepts_gratis BOOLEAN DEFAULT true,      -- Willing to help for free in some cases
  accepts_kulturlegi BOOLEAN DEFAULT true,  -- Accepts KulturLegi 50% discount

  -- Service delivery options
  service_types TEXT[] DEFAULT ARRAY['remote', 'onsite'],

  -- Location for onsite services
  location_postal_code VARCHAR(10),
  location_city VARCHAR(100),
  location_canton VARCHAR(50),
  max_travel_km INTEGER DEFAULT 10,

  -- Availability
  is_active BOOLEAN DEFAULT true,

  -- Statistics (updated by triggers/jobs)
  total_helps_completed INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for helper searches
CREATE INDEX IF NOT EXISTS idx_helper_profiles_user_id ON helper_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_helper_profiles_location ON helper_profiles(location_postal_code);
CREATE INDEX IF NOT EXISTS idx_helper_profiles_canton ON helper_profiles(location_canton);
CREATE INDEX IF NOT EXISTS idx_helper_profiles_active ON helper_profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_helper_profiles_rating ON helper_profiles(average_rating DESC) WHERE average_rating IS NOT NULL;

-- ============================================================================
-- Rename peer_repair tables to it_hilfe tables
-- These tables already exist from 010_peer_repair_system.sql
-- ============================================================================

-- Check if old tables exist before renaming
DO $$
BEGIN
  -- Rename peer_repair_requests to it_hilfe_requests
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'peer_repair_requests')
     AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'it_hilfe_requests') THEN
    ALTER TABLE peer_repair_requests RENAME TO it_hilfe_requests;
    -- Also rename any indexes
    ALTER INDEX IF EXISTS idx_peer_repair_requests_user_id RENAME TO idx_it_hilfe_requests_user_id;
    ALTER INDEX IF EXISTS idx_peer_repair_requests_status RENAME TO idx_it_hilfe_requests_status;
    ALTER INDEX IF EXISTS idx_peer_repair_requests_category RENAME TO idx_it_hilfe_requests_category;
    RAISE NOTICE 'Renamed peer_repair_requests to it_hilfe_requests';
  END IF;

  -- Rename peer_repair_offers to it_hilfe_offers
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'peer_repair_offers')
     AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'it_hilfe_offers') THEN
    ALTER TABLE peer_repair_offers RENAME TO it_hilfe_offers;
    -- Also rename any indexes
    ALTER INDEX IF EXISTS idx_peer_repair_offers_request_id RENAME TO idx_it_hilfe_offers_request_id;
    ALTER INDEX IF EXISTS idx_peer_repair_offers_helper_id RENAME TO idx_it_hilfe_offers_helper_id;
    ALTER INDEX IF EXISTS idx_peer_repair_offers_status RENAME TO idx_it_hilfe_offers_status;
    RAISE NOTICE 'Renamed peer_repair_offers to it_hilfe_offers';
  END IF;
END $$;

-- ============================================================================
-- Add service_category column to requests if not exists
-- This allows categorizing requests by service type (repair, setup, support, etc.)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'it_hilfe_requests') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns
                   WHERE table_name = 'it_hilfe_requests' AND column_name = 'service_category') THEN
      ALTER TABLE it_hilfe_requests ADD COLUMN service_category VARCHAR(50) DEFAULT 'repair';
      RAISE NOTICE 'Added service_category column to it_hilfe_requests';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- Update trigger for updated_at columns
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to user_skills
DROP TRIGGER IF EXISTS update_user_skills_updated_at ON user_skills;
CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON user_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to helper_profiles
DROP TRIGGER IF EXISTS update_helper_profiles_updated_at ON helper_profiles;
CREATE TRIGGER update_helper_profiles_updated_at
  BEFORE UPDATE ON helper_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE user_skills IS 'Stores IT skills that users can offer to help others';
COMMENT ON TABLE helper_profiles IS 'Optional profile for users offering IT help services';
COMMENT ON COLUMN user_skills.skill_id IS 'References skill ID from IT_SKILLS config in it-hilfe.ts';
COMMENT ON COLUMN user_skills.category_id IS 'References service category ID (repair, setup, support, data, network)';
COMMENT ON COLUMN helper_profiles.service_types IS 'Array of service delivery types: remote, onsite, pickup, dropoff, flexible';
COMMENT ON COLUMN helper_profiles.accepts_gratis IS 'Whether helper is willing to help for free in emergency cases';
COMMENT ON COLUMN helper_profiles.accepts_kulturlegi IS 'Whether helper accepts KulturLegi 50% discount';
