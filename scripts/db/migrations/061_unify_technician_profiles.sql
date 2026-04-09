-- Unify technician profiles: merge helper_profiles into repairer_profiles
-- This is the key step in eliminating the repairer/helper/technician SSOT violation.

-- Step 1: Add community-specific columns to repairer_profiles
ALTER TABLE repairer_profiles ADD COLUMN IF NOT EXISTS accepts_gratis BOOLEAN DEFAULT false;
ALTER TABLE repairer_profiles ADD COLUMN IF NOT EXISTS accepts_kulturlegi BOOLEAN DEFAULT false;
ALTER TABLE repairer_profiles ADD COLUMN IF NOT EXISTS max_travel_km INTEGER DEFAULT 10;
ALTER TABLE repairer_profiles ADD COLUMN IF NOT EXISTS service_delivery_types TEXT[] DEFAULT '{flexible}';
ALTER TABLE repairer_profiles ADD COLUMN IF NOT EXISTS profile_tier TEXT DEFAULT 'professional';

-- Step 2: Migrate helper_profiles data into repairer_profiles
-- For users with helper_profiles but NO repairer_profiles: INSERT
INSERT INTO repairer_profiles (
  id, user_id, description, hourly_rate_cents, city, postal_code,
  accepts_gratis, accepts_kulturlegi, max_travel_km, service_delivery_types,
  profile_tier, is_active, is_verified, average_rating, total_jobs_completed,
  status, created_at, updated_at
)
SELECT
  hp.id, hp.user_id, hp.bio, hp.hourly_rate_cents,
  hp.location_city, hp.location_postal_code,
  hp.accepts_gratis, hp.accepts_kulturlegi, hp.max_travel_km, hp.service_types,
  'community', hp.is_active, hp.is_verified, hp.average_rating, hp.total_helps_completed,
  CASE WHEN hp.is_active THEN 'active' ELSE 'inactive' END,
  hp.created_at, hp.updated_at
FROM helper_profiles hp
WHERE hp.user_id NOT IN (SELECT user_id FROM repairer_profiles WHERE user_id IS NOT NULL);

-- For users with BOTH helper_profiles AND repairer_profiles: UPDATE with community fields
UPDATE repairer_profiles rp
SET
  accepts_gratis = hp.accepts_gratis,
  accepts_kulturlegi = hp.accepts_kulturlegi,
  max_travel_km = hp.max_travel_km,
  service_delivery_types = hp.service_types
FROM helper_profiles hp
WHERE rp.user_id = hp.user_id;

-- Step 3: Create backwards-compatible view
CREATE OR REPLACE VIEW helper_profiles_v AS
SELECT
  id, user_id, description AS bio, NULL::text AS avatar_url,
  hourly_rate_cents, accepts_gratis, accepts_kulturlegi,
  service_delivery_types AS service_types,
  postal_code AS location_postal_code, city AS location_city,
  NULL::varchar(50) AS location_canton,
  max_travel_km, is_active, is_verified,
  NULL::timestamptz AS verified_at, NULL::uuid AS verified_by,
  NULL::timestamptz AS suspended_at, NULL::text AS admin_notes,
  total_jobs_completed AS total_helps_completed, average_rating,
  created_at, updated_at
FROM repairer_profiles
WHERE profile_tier = 'community' OR accepts_gratis = true;
