-- Migration 100: IT-Hilfe SSOT fixes — offer_count single writer + profile_tier default
--
-- A2: offer_count had TWO writers. A DB trigger (update_peer_repair_offer_count,
-- restored in migration 090) incremented on INSERT, AND the API increments in
-- code (offers/route.ts). Every fresh offer therefore counted +2. Make the
-- application the single source of truth (it already handles insert / resurrect /
-- withdraw consistently and is now transactional). Dropping the function CASCADE
-- removes its trigger too. This also fixes dev/prod parity: the dev DB is built
-- with `drizzle-kit push` (no SQL triggers) while prod ran the SQL migrations
-- (had the trigger) — they now behave identically.
DROP FUNCTION IF EXISTS public.update_peer_repair_offer_count() CASCADE;

-- Reconcile existing (double-counted) values: an open request's offer_count is
-- the number of offers that still stand (everything except withdrawn).
UPDATE it_hilfe_requests r
SET offer_count = (
  SELECT COUNT(*) FROM it_hilfe_offers o
  WHERE o.request_id = r.id AND o.status <> 'withdrawn'
);

-- A4: self-serve technician registrations are the 'community' tier. The column
-- defaulted to 'professional' — the opposite of the model (only saved because the
-- PUT endpoint always overrides it). Align the default so any other insert path
-- is correct by construction.
ALTER TABLE repairer_profiles ALTER COLUMN profile_tier SET DEFAULT 'community';
