-- Backfill repairer_profiles for users with IT skills but no profile row.
-- Safe after helper_profiles was dropped (073). Does NOT read helper_profiles.
-- Supplements 061/094 when those could not run or missed rows.

INSERT INTO repairer_profiles (
  user_id,
  description,
  city,
  postal_code,
  canton,
  accepts_gratis,
  accepts_kulturlegi,
  max_travel_km,
  service_delivery_types,
  profile_tier,
  is_active,
  is_verified,
  status,
  phone,
  address
)
SELECT DISTINCT ON (u.id)
  u.id,
  '',
  '',
  '',
  NULL,
  true,
  true,
  10,
  ARRAY['flexible']::text[],
  'community',
  false,
  false,
  'pending_review',
  '',
  ''
FROM users u
INNER JOIN user_skills us ON us.user_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM repairer_profiles rp WHERE rp.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;
