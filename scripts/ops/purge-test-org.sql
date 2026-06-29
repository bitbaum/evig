-- Second one-time prod cleanup (2026-06-29): purge E2E test ORG content + test
-- accounts. Run AFTER scripts/ops/purge-demo-content.sql (marketplace/IT-Hilfe).
--
-- Every row in these tables was verified E2E-titled ("E2E Blog", "E2E Task",
-- "E2E Entscheid", "E2E Protokoll", "E2E HR Stelle", "E2E Workshop-Vorschlag").
-- The prod DB had been filled entirely by E2E test runs; the only real accounts
-- are georgy.butaev@revamp-it.ch and shop@revamp-it.ch.
--
-- Preserved: the 2 real staff users, georgy's real membership_application, and
-- the 3 physical `locations`. Deleting the ~53 test users cascades all their
-- owned data; the org tables are truncated first so NO-ACTION FKs to users are
-- empty and the user delete is not blocked.
--
-- Run manually against prod inside a transaction (dry-run with ROLLBACK first).
-- NOT auto-applied by deploy.

TRUNCATE TABLE
  blog_posts, blog_submissions,
  job_postings, job_applications,
  workshops,
  decisions,
  meeting_protocols,
  tasks
CASCADE;

-- Delete every account except the two real staff users (cascades their data).
DELETE FROM users
WHERE email NOT IN ('georgy.butaev@revamp-it.ch','shop@revamp-it.ch');

-- Clear stale test-activity artifacts for the remaining staff accounts
-- (notification bell badge + activity feed were all from E2E runs).
DELETE FROM notifications;
DELETE FROM activity_feed;
