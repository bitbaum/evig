-- Migration 085: location_approvals immutability
--
-- 2026-06-03 DB audit flagged: location_approvals.reviewed_at is mutable.
-- If a reviewer changes their mind, the original decision timestamp is
-- overwritten with no audit trail. For compliance, decisions on
-- public-listing approvals must be append-only.
--
-- Approach: trigger that prevents UPDATE of the columns that capture a
-- decision (action, status, review_notes, required_changes, reviewer_id,
-- reviewed_at). New decisions = INSERT a new row. Old decisions remain
-- as historical record.
--
-- Idempotent: trigger creation uses DROP IF EXISTS pattern; function
-- creation uses CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION prevent_location_approval_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow internal admin-flag updates (none currently) by checking
  -- which columns actually changed. The fields below are the decision
  -- record proper — overwriting them destroys audit history.
  IF NEW.action IS DISTINCT FROM OLD.action
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.review_notes IS DISTINCT FROM OLD.review_notes
     OR NEW.required_changes IS DISTINCT FROM OLD.required_changes
     OR NEW.reviewer_id IS DISTINCT FROM OLD.reviewer_id
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
  THEN
    RAISE EXCEPTION 'location_approvals decision fields are immutable. INSERT a new row for a follow-up decision (reviewer=% on location=%).',
      NEW.reviewer_id, NEW.location_id
      USING ERRCODE = '23000';  -- integrity_constraint_violation
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF to_regclass('public.location_approvals') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_prevent_location_approval_update ON location_approvals;
    CREATE TRIGGER trg_prevent_location_approval_update
      BEFORE UPDATE ON location_approvals
      FOR EACH ROW
      EXECUTE FUNCTION prevent_location_approval_update();
  END IF;
END $$;
