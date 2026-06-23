-- Migration 093: Repair schema drift on Neon/prod
--
-- 1. budget_tier — migration 049 was recorded but the column was missing on
--    some databases. Idempotent re-apply.
-- 2. notifications.type CHECK — sync with src/config/notifications.ts
--    (NOTIFICATION_TYPES). Migration 069 predates it_hilfe_request_confirmation,
--    it_hilfe_matching_request, it_hilfe_review_received, and time-off types.

ALTER TABLE it_hilfe_requests
  ADD COLUMN IF NOT EXISTS budget_tier VARCHAR(20);

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
      'decision_deadline',
      -- Protocols
      'protocol_finalized',
      -- Blog submissions
      'blog_submission_status',
      -- IT-Hilfe
      'it_hilfe_request_confirmation',
      'it_hilfe_matching_request',
      'it_hilfe_new_offer',
      'it_hilfe_offer_accepted',
      'it_hilfe_offer_rejected',
      'it_hilfe_request_completed',
      'it_hilfe_review_received',
      -- Membership
      'membership_approved',
      -- Workshops
      'workshop_proposal_approved',
      -- Marketplace
      'listing_sold',
      -- Service appointments
      'service_appointment_assigned',
      'service_appointment_completed',
      -- Time off
      'time_off_requested',
      'time_off_reviewed'
    ));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;
