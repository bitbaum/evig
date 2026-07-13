-- 122_drop_profile_identity_dupes.sql
-- =============================================================================
-- Profiles SSOT — Phase 3 of 3 (CONTRACT — drop duplicated identity columns)
-- =============================================================================
-- Ground truth #2: one source of truth. Phase 1 (121) hoisted public identity
-- (display_name, avatar_url, bio, is_verified, verification_date) onto
-- user_profiles and backfilled it. Phases 2a (sellers) and 2b (technicians)
-- switched every reader AND writer to user_profiles and shipped LIVE, so nothing
-- reads these role-table columns anymore.
--
-- This migration removes the now-dead duplicates. It is deploy-safe ONLY because
-- 2a/2b are already live: the deploy applies this before activating the new
-- build, and the currently-serving build no longer selects these columns.
--
-- Ordering note for the from-zero CI replay: 121 backfills user_profiles FROM
-- these columns and runs first; this migration drops them afterwards. Idempotent
-- (IF EXISTS) so the replay is safe.
--
-- NOT touched: seller_profiles.canton / technician_profiles.city+canton (distinct
-- storefront / service-base facts), technician_profiles.verification_documents
-- (professional application docs), technician_reviews.is_verified (a review flag).

BEGIN;

-- helper_profiles_v is a dead view (last recreated in 064, DROPped in 073 when
-- its TS was removed — no codebase reader). It was already gone in the from-zero
-- replay, but lingered on the prod DB (drift) and still references
-- technician_profiles.is_verified, which blocked the column drop. Drop the
-- remnant here; IF EXISTS makes it a no-op on the clean replay.
DROP VIEW IF EXISTS helper_profiles_v;

-- Single-column indexes drop with their columns, but be explicit + idempotent.
DROP INDEX IF EXISTS idx_seller_profiles_verified;
DROP INDEX IF EXISTS idx_repairer_profiles_verified;

ALTER TABLE seller_profiles
  DROP COLUMN IF EXISTS display_name,
  DROP COLUMN IF EXISTS avatar_url,
  DROP COLUMN IF EXISTS bio,
  DROP COLUMN IF EXISTS is_verified,
  DROP COLUMN IF EXISTS verification_date;

ALTER TABLE technician_profiles
  DROP COLUMN IF EXISTS is_verified,
  DROP COLUMN IF EXISTS verification_date;

COMMIT;
