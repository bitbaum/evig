-- Migration 039: Fix notification type CHECK constraint
--
-- The original CHECK (migration 005) only allowed ('message','appointment','marketplace','system','marketing').
-- Migration 021 added task types but missed decision/protocol types that the app actually inserts.
-- This migration adds all types the codebase uses and backfills sent_in_app for existing rows.

DO $$
BEGIN
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
      CHECK (type IN (
        -- Core
        'message',
        'appointment',
        'marketplace',
        'system',
        'marketing',
        -- Task management (added in 021)
        'task_attention',
        'task_request',
        'task_completed',
        'task_broadcast',
        -- Decision system
        'decision_voting',
        'decision_closed',
        -- Protocols
        'protocol_finalized'
      ));
EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_column THEN NULL;
END $$;

-- Backfill: mark all existing notifications as sent in-app
UPDATE notifications SET sent_in_app = true WHERE sent_in_app IS NULL OR sent_in_app = false;
