-- Migration 040: Add task_request_response notification type
--
-- Allows the notifications table to store the new type used when
-- someone responds (accepts/declines) to a task request.

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
        'protocol_finalized'
      ));
EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_column THEN NULL;
END $$;
