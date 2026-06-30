-- Migration 106: ensure workshop_instances.current_participants exists
--
-- The paid-workshop registration path (POST /api/workshops/[slug]/register-with-payment)
-- and the webhook (lib/services/payment-webhook.ts) read and increment
-- `workshop_instances.current_participants` for capacity checks. That column was
-- created by the legacy cms-api migration system and was NEVER added by any file
-- in scripts/db/migrations/ — so a migration-built database (incl. prod) can lack
-- it entirely, which would 500 the paid-registration INSERT path the moment
-- Payrexx goes live. (Found during E2E testing of the revenue flows — the dev DB
-- was missing it.)
--
-- Idempotent: adds the column only if absent, normalises any NULLs, and backfills
-- the count from existing confirmed registrations so capacity checks are accurate.

ALTER TABLE workshop_instances
  ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 0;

UPDATE workshop_instances wi
SET current_participants = COALESCE((
  SELECT COUNT(*)::int
  FROM workshop_registrations wr
  WHERE wr.workshop_instance_id = wi.id
    AND wr.status = 'confirmed'
), 0);
