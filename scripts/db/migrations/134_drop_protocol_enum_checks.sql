-- Migration 134: protocols — guarantee input_method exists, drop legacy enum CHECKs
--
-- Prod incident (2026-07-16): creating a protocol with input_method='audio'
-- failed the INSERT. Root cause: migration 027b used
-- `ADD COLUMN IF NOT EXISTS input_method ... CHECK (...)`. On databases where
-- the column already existed, the whole ALTER is a silent no-op — so the CHECK
-- that includes 'audio' never replaced the older hand-synced value list, and
-- the DB kept rejecting valid app-level values.
--
-- Same failure class as notifications_type_check (dropped in migration 110):
-- an app-level enum duplicated into a DB CHECK drifts and rejects valid
-- values. All CHECKs on the protocol tables are enum value lists, validated
-- at the write boundary:
--   meeting_type / visibility / input_method → createProtocolSchema /
--     updateProtocolSchema (zod, derived from src/config/protocols.ts)
--   status → written only by internal services using config constants
--   link_type → linkActionSchema (zod)
-- Neither table has range/money/date-ordering CHECKs, so dropping all CHECK
-- constraints on them is safe.
--
-- Policy (CLAUDE.md): app-level enums = config constant + zod at the write
-- boundary. DB CHECKs are reserved for true invariants.

-- 1. Guarantee the column exists (no-op where 027b already ran fully).
ALTER TABLE meeting_protocols
  ADD COLUMN IF NOT EXISTS input_method TEXT DEFAULT 'transcript';

-- 2. Drop every CHECK constraint on the protocol tables. Constraint names
--    vary between environments (inline CREATE TABLE vs ALTER-added), so drop
--    by catalog lookup instead of guessing names.
DO $$
DECLARE
  con RECORD;
BEGIN
  FOR con IN
    SELECT conrelid::regclass AS tbl, conname
    FROM pg_constraint
    WHERE contype = 'c'
      AND conrelid IN (
        'meeting_protocols'::regclass,
        'protocol_action_links'::regclass
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', con.tbl, con.conname);
  END LOOP;
END $$;

COMMENT ON COLUMN meeting_protocols.input_method
  IS 'Pipeline entry point: audio | transcript | notes | tasks — validated in app (src/config/protocols.ts), no DB CHECK (migration 134)';
