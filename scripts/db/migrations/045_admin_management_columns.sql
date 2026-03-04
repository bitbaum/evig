-- ============================================================================
-- Migration 045: Admin Management Columns
--
-- Adds columns needed for full admin management of Marketplace and IT-Hilfe:
-- 1. listing_reports: resolution fields
-- 2. listings: admin_notes
-- 3. helper_profiles: verification and suspension fields
-- 4. it_hilfe_requests: admin_notes
-- ============================================================================

-- listing_reports: add resolution fields
ALTER TABLE listing_reports
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS resolution_action VARCHAR(50);

COMMENT ON COLUMN listing_reports.resolution_notes IS 'Admin notes about resolution of the report';
COMMENT ON COLUMN listing_reports.resolution_action IS 'Action taken: dismiss, warn_seller, remove_listing';

-- listings: add admin_notes
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

COMMENT ON COLUMN listings.admin_notes IS 'Internal admin notes about this listing';

-- helper_profiles: add verification and suspension fields
ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

COMMENT ON COLUMN helper_profiles.is_verified IS 'Whether the helper has been verified by admin';
COMMENT ON COLUMN helper_profiles.verified_at IS 'When the helper was verified';
COMMENT ON COLUMN helper_profiles.verified_by IS 'Admin who verified the helper';
COMMENT ON COLUMN helper_profiles.suspended_at IS 'When the helper was suspended (NULL = active)';
COMMENT ON COLUMN helper_profiles.admin_notes IS 'Internal admin notes about this helper';

-- it_hilfe_requests: add admin_notes
ALTER TABLE it_hilfe_requests
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

COMMENT ON COLUMN it_hilfe_requests.admin_notes IS 'Internal admin notes about this request';
