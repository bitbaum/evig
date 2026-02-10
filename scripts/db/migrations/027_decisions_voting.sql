-- Team Decisions & Voting System
-- Creates 3 tables: decisions, decision_votes, decision_comments

-- ─── Decisions ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS decisions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Type & method
  decision_type  TEXT NOT NULL,  -- sense_check | prioritize | choose | approve
  voting_method  TEXT NOT NULL,  -- consent | approval | dot | score | simple_majority

  -- Options for approval/dot/score voting (JSON array of { id, label, description })
  options JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Quorum config (JSON: { type: "percentage"|"absolute", value: number })
  quorum JSONB NOT NULL DEFAULT '{"type":"percentage","value":50}'::jsonb,

  blind_voting BOOLEAN NOT NULL DEFAULT true,
  dot_count    INTEGER,  -- For dot voting only

  -- Participants (JSON array of user IDs, empty = all users)
  invited_participants JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Status workflow: draft → discussion → voting → closed | cancelled
  status TEXT NOT NULL DEFAULT 'draft',

  -- Deadlines
  discussion_deadline TIMESTAMPTZ,
  voting_deadline     TIMESTAMPTZ,

  -- Outcome (populated on close)
  outcome         JSONB,
  outcome_summary TEXT,
  revealed_at     TIMESTAMPTZ,
  closed_at       TIMESTAMPTZ,
  closed_by       UUID,
  cancel_reason   TEXT,

  -- Creator
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_created_by ON decisions(created_by);
CREATE INDEX IF NOT EXISTS idx_decisions_voting_deadline ON decisions(voting_deadline);

-- ─── Decision Votes ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS decision_votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Shape varies by voting method (JSON)
  vote_data JSONB NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(decision_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_decision_votes_decision_id ON decision_votes(decision_id);
CREATE INDEX IF NOT EXISTS idx_decision_votes_user_id ON decision_votes(user_id);

-- ─── Decision Comments ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS decision_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  content  TEXT NOT NULL,
  position TEXT NOT NULL,  -- for | against | question | info

  -- Optional: which option this relates to
  option_id TEXT,

  -- Threading
  parent_comment_id UUID REFERENCES decision_comments(id),

  is_edited  BOOLEAN NOT NULL DEFAULT false,
  edited_at  TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decision_comments_decision_id ON decision_comments(decision_id);
CREATE INDEX IF NOT EXISTS idx_decision_comments_user_id ON decision_comments(user_id);

-- ─── Auto-update triggers for updated_at ────────────────────────────────────
-- Note: update_updated_at_column() function already exists from earlier migrations

CREATE TRIGGER update_decisions_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decision_votes_updated_at
  BEFORE UPDATE ON decision_votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
