-- Migration 058: Blog submission requires_changes status + notification type
--
-- 1. Extends blog_submissions.status CHECK to include 'requires_changes'
--    so admins can ask submitters to revise without outright rejecting.
-- 2. Extends notifications.type CHECK to include 'blog_submission_status'
--    used for in-app notifications when a submission's status changes.

-- ---------------------------------------------------------------------------
-- blog_submissions.status
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE blog_submissions DROP CONSTRAINT IF EXISTS blog_submissions_status_check;

  ALTER TABLE blog_submissions ADD CONSTRAINT blog_submissions_status_check
    CHECK (status IN (
      'pending',
      'approved',
      'rejected',
      'published',
      'requires_changes'
    ));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- notifications.type
-- ---------------------------------------------------------------------------
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
      -- Task management
      'task_attention',
      'task_request',
      'task_request_response',
      'task_completed',
      'task_broadcast',
      -- Decision system
      'decision_voting',
      'decision_closed',
      -- Protocols
      'protocol_finalized',
      -- Blog submissions
      'blog_submission_status'
    ));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;
