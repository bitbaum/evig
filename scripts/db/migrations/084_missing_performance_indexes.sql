-- Migration 084: Performance indexes the audit flagged as missing
-- Idempotent: skip when target table/column missing on fresh CI databases.

DO $$
BEGIN
  IF to_regclass('public.notifications') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_recent
      ON notifications(user_id, is_read, created_at DESC);
  END IF;

  IF to_regclass('public.pool_memberships') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_pool_memberships_pool_status
      ON pool_memberships(pool_id, status);
  END IF;

  IF to_regclass('public.inventory_items') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_inventory_items_status_assignee
      ON inventory_items(status, assigned_to);
  END IF;

  IF to_regclass('public.fundraising_foundations') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fundraising_foundations' AND column_name = 'archived'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_fundraising_foundations_active_recent
      ON fundraising_foundations(created_at DESC)
      WHERE archived = false;
  END IF;
END $$;
