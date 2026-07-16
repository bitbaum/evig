-- Migration 135: Intake checklist verdicts (pass / fail / n.a.)
--
-- The intake checklist stored only a boolean `completed` per item. That can't
-- express the most important QC outcome — a FAILED test — so failed devices
-- silently rotted in "in Bearbeitung" with no recorded reason. This migration:
--
--   1. Adds inventory_items.checklist_failed — cached derivation (same pattern
--      as checklist_complete) so the pipeline can filter/count failed devices
--      in SQL. Recomputed by the checklist API on every verdict change.
--   2. Rewrites intake_checklist JSONB item states from
--        { "completed": bool, ... }  →  { "result": 'pass'|null, ... }
--      (completed=true → result='pass'; completed=false → result=null/open).
--
-- App-level enum ('pass','fail','na') lives in src/config/intake-checklist.ts
-- + zod at the write boundary — intentionally NO CHECK constraint (see CLAUDE.md).
--
-- Depends on: 046_unified_intake.sql (intake_checklist, checklist_complete)

BEGIN;

ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS checklist_failed BOOLEAN NOT NULL DEFAULT false;

-- Rewrite existing checklist item states to the verdict shape.
-- Idempotent: items that already carry a 'result' key are kept as-is.
UPDATE inventory_items
SET intake_checklist = (
  SELECT COALESCE(
    jsonb_object_agg(
      e.key,
      (e.value - 'completed') || jsonb_build_object(
        'result',
        CASE
          WHEN e.value ? 'result' THEN e.value -> 'result'
          WHEN (e.value ->> 'completed')::boolean IS TRUE THEN to_jsonb('pass'::text)
          ELSE 'null'::jsonb
        END
      )
    ),
    '{}'::jsonb
  )
  FROM jsonb_each(intake_checklist) AS e
)
WHERE intake_checklist IS NOT NULL
  AND intake_checklist <> '{}'::jsonb;

-- The pipeline "failed" bucket filters on this flag.
CREATE INDEX IF NOT EXISTS idx_inventory_checklist_failed
  ON inventory_items (checklist_failed)
  WHERE checklist_failed = true;

COMMIT;
