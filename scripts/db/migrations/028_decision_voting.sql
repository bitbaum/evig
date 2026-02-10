-- Migration 028: Decision voting and outcomes for protocol action items
-- Enables team voting on decision items, AI task proposals, and bulk task creation

-- Votes: one per user per decision, toggle behavior
CREATE TABLE IF NOT EXISTS decision_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES meeting_protocols(id) ON DELETE CASCADE,
  action_item_id TEXT NOT NULL,
  voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(protocol_id, action_item_id, voter_id)
);

-- Outcomes: tracks close state, AI proposals, task creation
CREATE TABLE IF NOT EXISTS decision_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES meeting_protocols(id) ON DELETE CASCADE,
  action_item_id TEXT NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  closed_by UUID REFERENCES users(id),
  closed_at TIMESTAMPTZ,
  result TEXT NOT NULL DEFAULT 'pending' CHECK (result IN ('approved', 'rejected', 'pending')),
  votes_up INT NOT NULL DEFAULT 0,
  votes_down INT NOT NULL DEFAULT 0,
  proposed_tasks JSONB,
  proposal_model TEXT,
  tasks_created BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(protocol_id, action_item_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_decision_votes_protocol ON decision_votes(protocol_id);
CREATE INDEX IF NOT EXISTS idx_decision_votes_action ON decision_votes(protocol_id, action_item_id);
CREATE INDEX IF NOT EXISTS idx_decision_outcomes_protocol ON decision_outcomes(protocol_id);

COMMENT ON TABLE decision_votes IS 'Individual votes on protocol decision items (thumbs up/down)';
COMMENT ON TABLE decision_outcomes IS 'Aggregated decision state, AI proposals, and task creation tracking';
