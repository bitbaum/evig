-- 086 — Decisions: link to source protocol/action item
--
-- Step 1 of unifying the two decision systems documented in
-- docs/ARCHITECTURE_DEBT.md #1. Adds nullable foreign keys so a
-- standalone decision can reference the protocol meeting + action
-- item it came from. Existing decisions remain unaffected (both
-- columns default NULL).
--
-- Next steps (separate migration, when the UI lands):
--   - Migrate existing protocol_decision_votes + protocol_decision_outcomes
--     into decisions + decision_votes.
--   - Drop the protocol_decision_* tables.
--
-- This migration alone is safe to run any time. Reversible:
--   ALTER TABLE decisions DROP COLUMN action_item_id, DROP COLUMN protocol_id;
--
-- 2026-06-04
-- =============================================================================

ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS protocol_id    uuid REFERENCES meeting_protocols(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS action_item_id text;

-- Lookup index for "all decisions that came from this protocol" + uniqueness:
-- one decision per (protocol, action_item) pair. action_item_id is a string ID
-- from the AI-extracted notes.action_items array, not a foreign key.
CREATE UNIQUE INDEX IF NOT EXISTS decisions_protocol_action_item_uniq
  ON decisions (protocol_id, action_item_id)
  WHERE protocol_id IS NOT NULL AND action_item_id IS NOT NULL;

-- Record in the migration tracking table (per scripts/db/migrations/083 bootstrap).
-- The schema_migrations table tracks by filename (not version) — same shape the
-- run-migration.sh runner uses, so this file applies correctly via direct psql
-- OR via the runner without double-insert.
INSERT INTO schema_migrations (filename)
VALUES ('086_decisions_protocol_link.sql')
ON CONFLICT (filename) DO NOTHING;
