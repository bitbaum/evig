-- Backfill repairer_profiles from helper_profiles where migration 061 missed rows
-- (e.g. when phone/address NOT NULL constraints were added later).
-- Idempotent: skips users who already have a repairer_profiles row.

INSERT INTO repairer_profiles (
  id, user_id, description, hourly_rate_cents, city, postal_code, canton,
  accepts_gratis, accepts_kulturlegi, max_travel_km, service_delivery_types,
  profile_tier, is_active, is_verified, status, phone, address, created_at, updated_at
)
SELECT
  hp.id, hp.user_id, hp.bio, hp.hourly_rate_cents,
  hp.location_city, hp.location_postal_code, hp.location_canton,
  hp.accepts_gratis, hp.accepts_kulturlegi, hp.max_travel_km, hp.service_types,
  'community', hp.is_active, COALESCE(hp.is_verified, false),
  CASE WHEN hp.is_active THEN 'active' ELSE 'inactive' END,
  '', '', hp.created_at, hp.updated_at
FROM helper_profiles hp
WHERE hp.user_id NOT IN (SELECT user_id FROM repairer_profiles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;
