-- Migration 094: Timecard notification types (submit + review)
-- Sync notifications.type CHECK with src/config/notifications.ts

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
      'time_off_reviewed',
      -- Timecards
      'timecard_submitted',
      'timecard_reviewed'
    ));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;
