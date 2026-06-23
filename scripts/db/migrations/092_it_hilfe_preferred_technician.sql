-- Preserve the technician selected from a public profile when creating an
-- IT-Hilfe request. Requests stay open to other offers until one is accepted.
ALTER TABLE it_hilfe_requests
  ADD COLUMN IF NOT EXISTS preferred_technician_id uuid
  REFERENCES repairer_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_it_hilfe_requests_preferred_technician
  ON it_hilfe_requests(preferred_technician_id)
  WHERE preferred_technician_id IS NOT NULL;
