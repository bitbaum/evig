-- Migration 068: Link workshops back to the proposal they were created from
ALTER TABLE workshops
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES workshop_proposals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workshops_proposal_id ON workshops(proposal_id);
