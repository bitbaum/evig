# QQQ.5 — DB Table + Column Rename Plan

**Status**: Planned. Not executed yet. Touches the live Neon prod DB —
needs explicit team sign-off before running.

## Goal

Finish the Technician naming consolidation at the DB layer. After QQQ.1-4
the code, types, API responses, components, and i18n all say
"Technician". The DB still says `repairer_*` and the offers table still
calls its FK `helper_id`. This is the final piece.

## What changes

### Tables (5)

| Old | New |
|---|---|
| `repairer_profiles` | `technician_profiles` |
| `repairer_services` | `technician_services` |
| `repairer_availability` | `technician_availability` |
| `repairer_reviews` | `technician_reviews` |
| `repairer_applications` | `technician_applications` |

### Columns

| Table | Old | New |
|---|---|---|
| `it_hilfe_offers` | `helper_id` | `technician_id` |
| `service_appointments` | `repairer_id` | `technician_id` |
| `service_appointments` | `repairer_profile_id` | `technician_profile_id` |

### Indexes / constraints

All indexes prefixed `idx_repairer_*` get renamed to `idx_technician_*`.
PG renames foreign-key constraints automatically when the referenced
table renames; verify post-migration with `\d+ <table>`.

## SQL migration

`scripts/db/migrations/0XX_rename_repairer_to_technician.sql`:

```sql
BEGIN;

-- 1. Tables
ALTER TABLE repairer_profiles RENAME TO technician_profiles;
ALTER TABLE repairer_services RENAME TO technician_services;
ALTER TABLE repairer_availability RENAME TO technician_availability;
ALTER TABLE repairer_reviews RENAME TO technician_reviews;
ALTER TABLE repairer_applications RENAME TO technician_applications;

-- 2. FK columns
ALTER TABLE it_hilfe_offers RENAME COLUMN helper_id TO technician_id;
ALTER TABLE service_appointments RENAME COLUMN repairer_id TO technician_id;
ALTER TABLE service_appointments RENAME COLUMN repairer_profile_id TO technician_profile_id;

-- 3. Index renames (sample — full list below)
ALTER INDEX idx_repairer_profiles_user_id RENAME TO idx_technician_profiles_user_id;
ALTER INDEX idx_repairer_profiles_verified RENAME TO idx_technician_profiles_verified;
ALTER INDEX idx_repairer_services_repairer_id RENAME TO idx_technician_services_technician_id;
-- ... (~12 more, see script/db/migrations/008b_repairer_system.sql for the full set to mirror)

-- 4. FK constraint renames (PG renames automatically on table rename;
--    verify with `\d+ technician_profiles` after migration).

COMMIT;
```

## Code changes (~80 files)

### Config (1 file)
`src/config/database.ts` — TABLE_NAMES values change. Key names
(`REPAIRER_PROFILES`, etc.) can stay or be renamed; either way the
string values must update to the new table names.

### Drizzle schema (5 files)
`src/db/schema/services.ts` — primary `repairerProfiles` table
declaration, all column refs, all helper tables.
`src/db/schema/itHilfe.ts` — `helperId` column → `technicianId`.
`src/db/schema/index.ts` — re-exports.

Recommend renaming the **TS identifier** too: `repairerProfiles` →
`technicianProfiles`. This is the riskiest piece — touches every query
that imports the schema.

### Raw SQL queries (~54 files)
Every `query()` call that uses `helper_id`, `repairer_id`,
`repairer_profile_id` in a string template gets updated.
Search command: `grep -rn 'helper_id\|repairer_id\b\|repairer_profile_id' src --include="*.ts"`

### Tests (~20 files)
Mock data, route tests that hard-code column names in expectations.

### Documentation
`docs/SHARED_CONTEXT.md`, CLAUDE.md table references.

## Deploy choreography

Postgres `RENAME` is metadata-only on Neon — near-instant, exclusive
lock for milliseconds. The risk is the **inflight queries** racing
the rename. Plan:

1. **Tag a release candidate** with all code changes ready (TS schema
   referencing new names, raw SQL using new names).
2. **Confirm dev/staging works** end-to-end against a copy of prod with
   migration applied.
3. **Maintenance window** (off-hours, 5 min):
   - Pause Vercel deploys.
   - Apply migration directly to prod Neon via `\i` or migration runner.
   - Immediately deploy the matching code.
   - Verify smoke tests (login, browse /techniker, create IT-Hilfe
     request, accept offer).
4. **Rollback plan** if anything breaks:
   - Re-run inverse migration (rename everything back).
   - Re-deploy previous code revision.

## Why this isn't bundled with QQQ.1-4

QQQ.1-4 are code-only refactors. Reverting any of them = `git revert`.
QQQ.5 modifies the live DB schema. Reverting requires either:
- A second migration to rename back (planned ahead of time), OR
- DB restore from a snapshot.

That's why every team I've seen treats DB renames as a separate PR with
its own review + a release window. Bundling is technically possible but
removes the "if QQQ.5 has a problem we can ship QQQ.1-4 anyway" safety
margin.

## Estimated cost

- **Plan + dry-run on local Neon branch**: ~2 hours
- **Code update + tests pass**: ~4 hours
- **Maintenance window**: ~5 min DB + 5 min deploy + 10 min smoke test

## Decision needed before executing

1. Is the maintenance-window approach OK, or do we need zero-downtime
   (dual-name shim during transition)?
2. Do we keep the original `REPAIRER_PROFILES` config key name as an
   alias for one release, or hard-cut?
3. Approval to apply the migration to prod Neon (the same kind of
   explicit sign-off given for migration 086 in the past).
