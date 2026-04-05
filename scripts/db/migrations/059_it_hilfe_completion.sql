-- Migration 058: IT-Hilfe completion + review tracking
-- Adds columns to track the repair closure flow:
--   completed_at — when the helper marked the request done
--   completed_by — which user marked it done (helper)
--   reviewed_at  — when the requester confirmed + reviewed

ALTER TABLE it_hilfe_requests
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_it_hilfe_requests_completed_at ON it_hilfe_requests(completed_at);
CREATE INDEX IF NOT EXISTS idx_it_hilfe_requests_reviewed_at  ON it_hilfe_requests(reviewed_at);
