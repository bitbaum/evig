-- Migration 112: baseline users.dashboard_mode
--
-- The app schema and Auth.js session mapping read users.dashboard_mode, but
-- the column had only existed on pushed databases. Fresh migration replays
-- need it before the local E2E seed/login path can run.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS dashboard_mode TEXT NOT NULL DEFAULT 'coordinator';
