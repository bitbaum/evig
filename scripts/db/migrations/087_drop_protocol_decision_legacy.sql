-- 087 — Drop the legacy protocol_decision_* tables (RR.3)
--
-- The protocol-decision UI bridge (RR.2) cut over to the standalone
-- `decisions` table via FK columns added in migration 086. Pre-cutover
-- audit confirmed 0 rows in both legacy tables in prod, so this
-- drop is data-loss-free.
--
-- Before running this migration, the corresponding code must already
-- be removed (RR.3 cleanup):
--   - src/app/api/protocols/[id]/decisions/  (4 routes)
--   - src/lib/services/protocols-voting.ts
--   - src/lib/services/__tests__/protocols-voting.test.ts
--   - protocolDecisionVotes + protocolDecisionOutcomes Drizzle schemas
--   - DecisionVoteRecord + DecisionOutcomeRecord types
--   - Re-exports from src/lib/services/protocols.ts
--
-- If those exist but the tables don't, runtime queries against them
-- will fail. Run the cleanup script BEFORE applying:
--   ./scripts/cleanup-rr3-legacy.sh   (deletes files)
--   psql "$DATABASE_URL" -f scripts/db/migrations/087_drop_protocol_decision_legacy.sql
--
-- Reversible: re-create via migration history (the tables' shape is
-- preserved in the protocols.ts Drizzle schema in commit 9d41784e's
-- parent — restore via git history if needed). Not designed to roll
-- back automatically because the legacy code is also being removed.
--
-- 2026-06-05
-- =============================================================================

DROP TABLE IF EXISTS protocol_decision_votes CASCADE;
DROP TABLE IF EXISTS protocol_decision_outcomes CASCADE;

INSERT INTO schema_migrations (filename)
VALUES ('087_drop_protocol_decision_legacy.sql')
ON CONFLICT (filename) DO NOTHING;
