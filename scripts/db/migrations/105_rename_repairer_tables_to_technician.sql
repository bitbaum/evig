-- Migration 105: rename the repairer_* tables to technician_* (debt #1 — entity rename)
--
-- "Repairer" and "technician" are the same concept; the public/API layer already
-- uses "technician" (/api/technicians is the SSOT, technician-service, etc.), but
-- the DB tables still carried the old "repairer" name. This renames the tables so
-- the schema matches the concept.
--
-- Scope: TABLE names only. Postgres ALTER TABLE RENAME automatically carries the
-- table's indexes + the FK constraints that point AT it (views/FKs track by OID,
-- so nothing else breaks). Deliberately NOT changed here (separately riskier):
--   - the `repairer_id` / `repairer_profile_id` COLUMN names on other tables
--   - the `'repairer'` user-role VALUE (stored data + every role check)
--   - index/constraint NAMES (cosmetic labels; left as-is)
--
-- Application references go through TABLE_NAMES (config) + Drizzle pgTable() names,
-- both updated in lockstep with this migration. Idempotent via IF EXISTS guards.
--
-- An empty orphan `technician_profiles` stub exists on prod (created by
-- 002b-simplified-auth, never adopted — the live data is in repairer_profiles).
-- It has 0 rows and no inbound FKs, and it blocks the rename below, so drop it
-- first. (Root cause of this migration's first deploy failing with
-- "relation technician_profiles already exists".)
DROP TABLE IF EXISTS technician_profiles;

ALTER TABLE IF EXISTS repairer_profiles     RENAME TO technician_profiles;
ALTER TABLE IF EXISTS repairer_services     RENAME TO technician_services;
ALTER TABLE IF EXISTS repairer_availability RENAME TO technician_availability;
ALTER TABLE IF EXISTS repairer_reviews      RENAME TO technician_reviews;
ALTER TABLE IF EXISTS repairer_applications RENAME TO technician_applications;
