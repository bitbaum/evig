-- Migration 076: Prevent overlapping scheduled instances of the same workshop
--
-- workshop_instances stores concrete scheduled occurrences of a workshop
-- (a 4-hour Linux installfest on Saturday, a 2-hour repair café next
-- Tuesday, etc.). The data integrity audit (2026-05-28) flagged that
-- nothing at the DB layer prevents an admin from accidentally creating
-- two instances of the same workshop_id that overlap in time. The form
-- has client-side validation, but a stale tab, a CSV import path, or a
-- raw SQL fix-it can all bypass it.
--
-- This migration adds an EXCLUDE constraint enforcing: for any given
-- workshop_id, no two `scheduled` instances may have overlapping
-- [start_date, end_date) ranges.
--
-- Scope:
--   - Only `status = 'scheduled'` is checked. A cancelled or completed
--     instance frees the slot — re-scheduling a workshop in the same
--     window after a cancellation is legitimate.
--   - Only rows with `end_date IS NOT NULL` are checked. Open-ended
--     instances (data quality issue, separate problem) are skipped.
--
-- Requires `btree_gist` for the workshop_id (UUID) component of the
-- composite gist index; tstzrange overlap (&&) is native to gist.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Guard the ADD CONSTRAINT so re-runs against a database that already
-- has it don't error. Postgres has no ADD CONSTRAINT IF NOT EXISTS for
-- EXCLUDE constraints, so check pg_constraint by name.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workshop_instances_no_overlap'
  ) THEN
    ALTER TABLE workshop_instances
      ADD CONSTRAINT workshop_instances_no_overlap
      EXCLUDE USING gist (
        workshop_id WITH =,
        tstzrange(start_date, end_date) WITH &&
      )
      WHERE (status = 'scheduled' AND end_date IS NOT NULL);
  END IF;
END
$$;
