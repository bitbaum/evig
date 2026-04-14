-- Migration 063: Decisions enhancements
-- Adds participant_scope (4-way enum: all_staff, board_only, all_members, invited)
-- and ai_outcome_narrative (auto-generated protocol text after close).

ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS participant_scope TEXT NOT NULL DEFAULT 'all_staff';

ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS ai_outcome_narrative TEXT;

CREATE INDEX IF NOT EXISTS idx_decisions_participant_scope ON decisions(participant_scope);
