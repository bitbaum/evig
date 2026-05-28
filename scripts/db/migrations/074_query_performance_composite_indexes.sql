-- Migration 074: Composite indexes for hot list-query paths
--
-- Audit (2026-05-28, performance lens) flagged four query patterns that
-- currently force PostgreSQL to either pick one single-column index and
-- post-filter on the other column, or to do a full sort after an index
-- scan. None of the four tables has a workload large enough TODAY for
-- this to be visibly slow, but each is on a path that grows linearly
-- with platform activity (messages per chat, notifications per user,
-- pool members, inventory pipeline) — so the right move is to add the
-- composites now, before they become a real "page is sluggish" bug.
--
-- All four indexes use IF NOT EXISTS so the migration is idempotent
-- and safe to re-run.

-- ----------------------------------------------------------------------
-- messages: "fetch last N messages in conversation X" — currently uses
-- idx_messages_conversation (single column) then sorts the result by
-- created_at. The composite supports both filter and sort in one scan.
-- ----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages (conversation_id, created_at DESC);

-- ----------------------------------------------------------------------
-- notifications: "list user X's notifications, unread first" — currently
-- has idx_notifications_user and idx_notifications_read as two separate
-- single-column indexes. Composite enables the dashboard bell + list
-- queries to use one scan. read_at DESC NULLS LAST so unread (NULL
-- read_at) sorts to the top.
-- ----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_at
  ON notifications (user_id, read_at DESC NULLS FIRST);

-- ----------------------------------------------------------------------
-- pool_memberships: "active members of pool X" — used by the pool join
-- handler (which now also takes FOR UPDATE on subscription_pools) to
-- count active members before allowing a new join. Without this, the
-- count subquery scans every membership row for the pool regardless of
-- status.
-- ----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_pool_memberships_pool_status
  ON pool_memberships (pool_id, status);

-- ----------------------------------------------------------------------
-- inventory_items: "items assigned to me, filtered by status" — the
-- erfassung admin's pipeline view and "my queue" filters. Currently
-- relies on either idx_inventory_status or idx_inventory_assigned_to,
-- never both.
-- ----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_inventory_status_assigned
  ON inventory_items (status, assigned_to);
