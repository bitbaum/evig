-- Migration 069: Extend notifications.type CHECK constraint
-- Adds IT-Hilfe, membership, workshop, listing, and appointment notification types.

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
      'it_hilfe_new_offer',
      'it_hilfe_offer_accepted',
      'it_hilfe_offer_rejected',
      'it_hilfe_request_completed',
      -- Membership
      'membership_approved',
      -- Workshops
      'workshop_proposal_approved',
      -- Marketplace
      'listing_sold',
      -- Service appointments
      'service_appointment_assigned',
      'service_appointment_completed'
    ));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;
