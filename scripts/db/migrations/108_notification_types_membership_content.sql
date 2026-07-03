-- Migration 108: notifications.type CHECK — add the two new types
--
-- src/config/notifications.ts gained:
--   membership_payment_recorded  (staff records a received membership fee)
--   content_submission_status    (user_content_submissions approve/reject —
--                                 in-app fallback so email is not the only signal)
-- Also drops the orphaned membership_approved (its writer, the dead
-- membership approval flow, was removed; no prod rows exist with this type).
--
-- Same drop-and-recreate pattern as migration 093 (the constraint SSOT is
-- src/config/notifications.ts — keep this list in sync with NOTIFICATION_TYPES).

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
      -- Generic user content submissions
      'content_submission_status',
      -- Membership
      'membership_payment_recorded',
      -- IT-Hilfe
      'it_hilfe_request_confirmation',
      'it_hilfe_matching_request',
      'it_hilfe_new_offer',
      'it_hilfe_offer_accepted',
      'it_hilfe_offer_rejected',
      'it_hilfe_request_completed',
      'it_hilfe_review_received',
      -- Workshops
      'workshop_proposal_approved',
      -- Marketplace
      'listing_sold',
      -- Service appointments
      'service_appointment_assigned',
      'service_appointment_completed',
      -- Time-off
      'time_off_requested',
      'time_off_reviewed',
      -- Timecards
      'timecard_submitted',
      'timecard_reviewed',
      -- HR / Careers
      'job_application_received',
      'job_application_status',
      'vacancy_published'
    ));
END $$;
