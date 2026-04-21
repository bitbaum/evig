-- Migration 064: Add canton to repairer_profiles
-- Completes migration 061 which merged helper_profiles into repairer_profiles
-- but omitted location_canton, leaving the canton filter silently broken in
-- /api/technicians.

-- Add the column
ALTER TABLE repairer_profiles
  ADD COLUMN IF NOT EXISTS canton VARCHAR(50);

-- Backfill from helper_profiles for community rows that were migrated in 061
UPDATE repairer_profiles rp
SET canton = hp.location_canton
FROM helper_profiles hp
WHERE rp.user_id = hp.user_id
  AND rp.canton IS NULL
  AND hp.location_canton IS NOT NULL;

-- Index for canton filter queries
CREATE INDEX IF NOT EXISTS idx_repairer_profiles_canton ON repairer_profiles (canton);

-- Update the backwards-compatible view to expose the real column
CREATE OR REPLACE VIEW helper_profiles_v AS
SELECT
  id, user_id, description AS bio, NULL::text AS avatar_url,
  hourly_rate_cents, accepts_gratis, accepts_kulturlegi,
  service_delivery_types AS service_types,
  postal_code AS location_postal_code, city AS location_city,
  canton AS location_canton,
  max_travel_km, is_active, is_verified,
  NULL::timestamptz AS verified_at, NULL::uuid AS verified_by,
  NULL::timestamptz AS suspended_at, NULL::text AS admin_notes,
  total_jobs_completed AS total_helps_completed, average_rating,
  created_at, updated_at
FROM repairer_profiles
WHERE profile_tier = 'community' OR accepts_gratis = true;
