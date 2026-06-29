-- Migration 102: unify technician ratings into the canonical `reviews` table
--
-- `reviews` is the single source for a technician's rating (it drives
-- repairer_profiles.average_rating via create-review.ts). But two legacy stores
-- held ratings that never reached it:
--   1. service_appointments.customer_rating/customer_review (inline) — written
--      by the appointment "rate" action; never counted toward the aggregate.
--   2. repairer_reviews — a standalone table read by the legacy /api/repairers.
-- Backfill both into `reviews` (target_type='repairer', target_id=profile id,
-- booking_id=appointment id), then recompute every technician's aggregate from
-- the unified store. Idempotent: NOT EXISTS + ON CONFLICT DO NOTHING make
-- re-runs safe. The legacy columns/table are left in place (deprecated) — a
-- later migration can drop them once readers are migrated.

-- 1. Inline service-appointment ratings → reviews
INSERT INTO reviews (reviewer_id, target_type, target_id, booking_id, overall_rating, content, status, is_verified_purchase, created_at)
SELECT sa.user_id, 'repairer', sa.repairer_profile_id, sa.id, sa.customer_rating,
       COALESCE(sa.customer_review, ''), 'published', true, COALESCE(sa.completed_at, now())
FROM service_appointments sa
WHERE sa.customer_rating IS NOT NULL
  AND sa.repairer_profile_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM reviews r
    WHERE r.reviewer_id = sa.user_id AND r.target_type = 'repairer'
      AND r.target_id = sa.repairer_profile_id AND r.booking_id = sa.id
  )
ON CONFLICT DO NOTHING;

-- 2. repairer_reviews → reviews (preserve the per-axis ratings)
INSERT INTO reviews (reviewer_id, target_type, target_id, booking_id, overall_rating,
                     communication_rating, quality_rating, timeliness_rating, title, content,
                     status, is_verified_purchase, created_at)
SELECT rr.customer_id, 'repairer', rr.repairer_id, rr.appointment_id, rr.rating,
       rr.communication_rating, rr.quality_rating, rr.timeliness_rating, rr.title,
       COALESCE(rr.comment, ''), 'published', COALESCE(rr.is_verified, false), COALESCE(rr.created_at, now())
FROM repairer_reviews rr
WHERE NOT EXISTS (
  SELECT 1 FROM reviews r
  WHERE r.reviewer_id = rr.customer_id AND r.target_type = 'repairer'
    AND r.target_id = rr.repairer_id
    AND (r.booking_id = rr.appointment_id OR (r.booking_id IS NULL AND rr.appointment_id IS NULL))
)
ON CONFLICT DO NOTHING;

-- 3. Recompute every technician's aggregate from the unified store: IT-Hilfe
--    reviews (via accepted offer → helper) + repairer reviews (via profile).
UPDATE repairer_profiles p SET
  average_rating = sub.avg_rating,
  total_reviews = sub.review_count
FROM (
  SELECT u AS user_id, AVG(rating)::numeric(3,2) AS avg_rating, COUNT(*)::int AS review_count
  FROM (
    SELECT o.helper_id AS u, r.overall_rating AS rating
    FROM reviews r
    JOIN it_hilfe_offers o ON o.request_id = r.target_id AND o.status = 'accepted'
    WHERE r.target_type = 'it_hilfe' AND r.status = 'published'
    UNION ALL
    SELECT p2.user_id AS u, r.overall_rating AS rating
    FROM reviews r
    JOIN repairer_profiles p2 ON p2.id = r.target_id
    WHERE r.target_type = 'repairer' AND r.status = 'published'
  ) all_reviews
  GROUP BY u
) sub
WHERE p.user_id = sub.user_id;
