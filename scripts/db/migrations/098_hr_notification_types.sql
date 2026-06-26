-- Migration 098: Notification types for HR vacancies (sync with src/config/notifications.ts)

DO $$
BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      'message',
      'appointment',
      'marketplace',
      'system',
      'marketing',
      'task_attention',
      'task_request',
      'task_request_response',
      'task_completed',
      'task_broadcast',
      'decision_voting',
      'decision_closed',
      'decision_deadline',
      'protocol_finalized',
      'blog_submission_status',
      'it_hilfe_request_confirmation',
      'it_hilfe_matching_request',
      'it_hilfe_new_offer',
      'it_hilfe_offer_accepted',
      'it_hilfe_offer_rejected',
      'it_hilfe_request_completed',
      'it_hilfe_review_received',
      'membership_approved',
      'workshop_proposal_approved',
      'listing_sold',
      'service_appointment_assigned',
      'service_appointment_completed',
      'time_off_requested',
      'time_off_reviewed',
      'timecard_submitted',
      'timecard_reviewed',
      'job_application_received',
      'job_application_status',
      'vacancy_published'
    ));
END $$;
