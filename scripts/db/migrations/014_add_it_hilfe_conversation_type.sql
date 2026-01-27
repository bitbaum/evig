-- Migration: Add 'it_hilfe' to conversation type constraint
-- Date: 2026-01-24
-- Purpose: Enable IT-Hilfe marketplace conversations

BEGIN;

-- Drop existing constraint
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_type_check;

-- Add updated constraint with 'it_hilfe' type
ALTER TABLE conversations
ADD CONSTRAINT conversations_type_check
CHECK (type IN ('direct', 'appointment', 'marketplace', 'service', 'it_hilfe'));

COMMIT;
