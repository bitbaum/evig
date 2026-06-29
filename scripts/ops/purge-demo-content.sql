-- One-time prod cleanup (2026-06-29): purge E2E/demo content.
--
-- Context: the prod DB had been filled by E2E test runs — 159 listings (144
-- "E2E …" titled), 150 IT-Hilfe requests, 82 service appointments, 75 erfassung
-- inventory items, plus a fabricated "George" technician (80 reviews / 80 jobs /
-- 5.0★ with ZERO backing review rows). None of it is real content.
--
-- This wipes the public demo content ONLY. It deliberately does NOT touch:
--   - user accounts (all 55 kept)
--   - org tables (tasks, decisions, meeting_protocols, workshops, blog_posts,
--     job_postings, …) — those are ambiguous (real-vs-seed) and out of scope here.
--
-- Run manually against prod inside a transaction (dry-run with ROLLBACK first):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/ops/purge-demo-content.sql
-- (wrap in BEGIN; \i …; COMMIT;). NOT auto-applied by deploy.

TRUNCATE TABLE
  listings,
  it_hilfe_requests,
  service_appointments,
  reviews,
  conversations,
  ai_extracted_products,
  inventory_items
CASCADE;

-- Fabricated technician profiles: keep only the real staff user's honest profile.
DELETE FROM repairer_profiles
WHERE user_id NOT IN (SELECT id FROM users WHERE email = 'georgy.butaev@revamp-it.ch');

-- Reset any remaining technician aggregates to truth (no reviews left -> 0).
UPDATE repairer_profiles SET average_rating = 0.0, total_reviews = 0, total_jobs_completed = 0;
