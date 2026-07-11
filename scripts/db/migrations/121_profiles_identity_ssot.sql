-- 121_profiles_identity_ssot.sql
-- =============================================================================
-- Profiles SSOT — Phase 1 of 3 (EXPAND + BACKFILL, non-breaking)
-- =============================================================================
-- Ground truth #2: one source of truth. A person's shared PUBLIC IDENTITY
-- (display_name, avatar_url, bio, verified status) is duplicated across
-- seller_profiles and technician_profiles today, so it can disagree. This
-- migration makes user_profiles the single owner:
--
--   * adds is_verified / verification_date to user_profiles
--     (verification is per-PERSON: verified once, shown in whatever role they act)
--   * backfills display_name / avatar_url / bio / is_verified from the role tables
--
-- NOTE — city/canton are deliberately NOT touched: on the role tables they are
-- distinct facts (seller storefront / technician service base used for
-- geo-matching), and personal city already lives in user_profiles.
--
-- The duplicated columns on the role tables are LEFT IN PLACE here. Readers move
-- to user_profiles in Phase 2; the role-table columns are dropped in a Phase 3
-- contract migration only after no code reads them. Kept idempotent so the CI
-- Migration Drift replay (from zero) is safe.

BEGIN;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_date timestamptz;

-- Every role-holder needs a user_profiles row so the SSOT read (users LEFT JOIN
-- user_profiles) always resolves identity fields.
INSERT INTO user_profiles (user_id)
SELECT user_id FROM seller_profiles
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_profiles (user_id)
SELECT user_id FROM technician_profiles
ON CONFLICT (user_id) DO NOTHING;

-- Identity fields: keep any value already set on user_profiles, otherwise adopt
-- the seller copy. (Technician has no display_name/avatar/bio to contribute.)
UPDATE user_profiles up
SET display_name = COALESCE(up.display_name, sp.display_name),
    avatar_url   = COALESCE(up.avatar_url, sp.avatar_url),
    bio          = COALESCE(up.bio, sp.bio)
FROM seller_profiles sp
WHERE sp.user_id = up.user_id;

-- Verified if verified in ANY role.
UPDATE user_profiles up
SET is_verified = true,
    verification_date = COALESCE(up.verification_date, sp.verification_date)
FROM seller_profiles sp
WHERE sp.user_id = up.user_id AND sp.is_verified = true;

UPDATE user_profiles up
SET is_verified = true,
    verification_date = COALESCE(up.verification_date, tp.verification_date)
FROM technician_profiles tp
WHERE tp.user_id = up.user_id AND tp.is_verified = true;

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_verified ON user_profiles (is_verified);

COMMIT;
