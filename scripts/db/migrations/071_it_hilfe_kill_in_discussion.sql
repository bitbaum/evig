-- Migration 071: Normalise legacy IT-Hilfe IN_DISCUSSION status to OPEN
-- Part of the IN_DISCUSSION kill (see commit e050cda1 for context):
--   The 'in_discussion' status was a dead state — auto-set when the first
--   offer arrived, but never user-facing in any UI surface (no badge, no
--   filter tab, no transition button). The auto-transition was removed in
--   e050cda1; this migration normalises pre-existing rows so the next code
--   commit can simplify all `OPEN || IN_DISCUSSION` filter checks to just
--   `OPEN` without losing access to legacy data.
--
-- Status column is VARCHAR(30) with no CHECK constraint (per migration 010),
-- so this is a pure data update. No schema change, no rollback risk beyond
-- the data overwrite itself. Idempotent: safe to re-run.

UPDATE it_hilfe_requests
SET status = 'open',
    updated_at = NOW()
WHERE status = 'in_discussion';
