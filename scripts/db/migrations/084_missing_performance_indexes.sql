-- Migration 084: Performance indexes the audit flagged as missing
--
-- 2026-06-03 DB audit found 3 composites declared in migration 074 that
-- never landed on Neon, plus 1 new gap (fundraising_foundations is 67 MB
-- / 16k rows — our largest table — doing 534 ms sequential scans).
--
-- All four are CREATE INDEX IF NOT EXISTS so safe to re-run, and they're
-- BIGINT/INTEGER/UUID/TIMESTAMPTZ columns — index build is near-instant
-- at current row counts.

-- ──────────────────────────────────────────────────────────────────────
-- notifications: dashboard "unread, newest first" query forces a sort
-- without this composite. With it, the planner uses an index-ordered scan.
-- ──────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_recent
  ON notifications(user_id, is_read, created_at DESC);

-- ──────────────────────────────────────────────────────────────────────
-- pool_memberships: pool-detail page lists active members; without this
-- composite we scan all memberships per pool.
-- ──────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pool_memberships_pool_status
  ON pool_memberships(pool_id, status);

-- ──────────────────────────────────────────────────────────────────────
-- inventory_items: admin "my queue" filters by status + assignee.
-- ──────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inventory_items_status_assignee
  ON inventory_items(status, assigned_to);

-- ──────────────────────────────────────────────────────────────────────
-- fundraising_foundations: NEW finding. 67 MB / 16k rows; current
-- public-browse query (WHERE archived = false ORDER BY created_at DESC)
-- does a sequential scan + sort. Partial index keeps it small (most rows
-- are not archived).
-- ──────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fundraising_foundations_active_recent
  ON fundraising_foundations(created_at DESC)
  WHERE archived = false;
