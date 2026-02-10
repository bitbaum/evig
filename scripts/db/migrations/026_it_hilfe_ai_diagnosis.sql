-- Migration 026: Add AI diagnosis column to IT-Hilfe requests
-- Stores the AI-generated first diagnosis for IT help requests

ALTER TABLE it_hilfe_requests ADD COLUMN IF NOT EXISTS ai_diagnosis TEXT;

COMMENT ON COLUMN it_hilfe_requests.ai_diagnosis IS 'AI-generated first diagnosis of the reported problem';
