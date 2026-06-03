# Disaster recovery — Neon Postgres

**Scope:** Database recovery. Vercel deployment recovery is automatic (rollback to previous deploy).

## Targets

| Metric | Target | Notes |
|---|---|---|
| **RTO** (recovery time objective) | < 1 hour | Neon PITR restore takes ~10-30 min; schema verify + app smoke-test ~30 min |
| **RPO** (recovery point objective) | < 5 minutes | Neon writes are durable to multiple AZs in `eu-central-1`; PITR granularity is per-second |
| **Backup retention** | 7 days (free tier) / 30 days (paid) | Confirm current tier at https://console.neon.tech |

## Restoration procedure

### Step 1 — Identify the recovery point

```bash
# Find the last known-good moment from the activity log / monitoring:
# - Vercel deploy that was healthy
# - Last user signup (auth_audit_log)
# - Last successful payment (payment_transactions)
```

Decide: restore to N minutes ago, or restore to the timestamp of the last good event.

### Step 2 — Trigger Neon point-in-time restore

In the Neon console:

1. Navigate to the project → Branches.
2. Click **Restore** on `main` branch.
3. Select **Restore to point in time**.
4. Enter the target timestamp (UTC).
5. Choose **Restore in place** (overwrites current) or **Create new branch** (recommended for safety — restore to a new branch first, verify, then promote).

**Recommended path: restore to a new branch first.** Lets you verify before pointing the app at it.

### Step 3 — Update connection string (if restored to new branch)

If you restored to a new branch (e.g. `restore-2026-06-03-1430`):

1. Neon dashboard → copy the new branch's connection string.
2. Update Vercel env var `DATABASE_URL` to the new branch URL.
3. Redeploy (Vercel → Deployments → Redeploy latest).

If you restored in place: no env change needed. Next deploy auto-picks up the restored data.

### Step 4 — Verify schema integrity

```bash
# Critical: check schema_migrations is intact.
source .env.local  # picks up potentially-updated DATABASE_URL
psql "$DATABASE_URL" -tA -c "SELECT COUNT(*) FROM schema_migrations"
# Expected: at least 84 (the count when this doc was written).
# If lower: the restore point is from before migration 083 landed.

# Apply any migrations missing since the restore point:
bash scripts/db/run-migration.sh
# The runner reads schema_migrations and only applies un-tracked files.
```

### Step 5 — Verify data integrity

```bash
# Spot-check critical row counts:
psql "$DATABASE_URL" -tA -c "
  SELECT 'users:'         || COUNT(*) FROM users
  UNION ALL SELECT 'listings:'      || COUNT(*) FROM listings
  UNION ALL SELECT 'inventory:'     || COUNT(*) FROM inventory_items
  UNION ALL SELECT 'donations:'     || COUNT(*) FROM donations
  UNION ALL SELECT 'projects:'      || COUNT(*) FROM projects
"
# Compare against the most-recent monitoring snapshot.

# Sweep for orphan FK / polymorphic references:
bash scripts/db/check-orphans.sh
```

### Step 6 — Smoke-test the app

1. `/api/health` returns 200 with `{ database: 'ok' }`.
2. Log in as `andreas@revamp-it.ch` (super admin) — confirm dashboard renders.
3. Visit `/projects/upcycling` — confirm the live needs feed renders (DB roundtrip).
4. Visit `/marketplace` — confirm listings load.

If any of the above fails, **do not** mark recovery complete. Either redo the restore to an earlier point, or escalate.

### Step 7 — Post-mortem

Within 24h of recovery:
- File an incident report in `docs/incidents/YYYY-MM-DD-<short-name>.md`.
- Cover: root cause, recovery time, data loss (if any), prevention work.

## What gets lost in a PITR restore

| Surface | Lost? |
|---|---|
| Database rows committed after the restore point | YES — exactly the RPO trade-off |
| File uploads (Vercel Blob) | NO — Vercel Blob is separate; restore doesn't touch it |
| Cached HTML / static assets | NO — Vercel serves from cache during DB recovery; users may see stale data briefly |
| Auth.js sessions in JWTs | NO — JWTs are stateless; logged-in users stay logged in |
| Sessions in `sessions` table | YES — affected users must re-log-in |
| Pending email notifications in queue | YES — re-trigger if business-critical |

## Local dev backup/restore

For dev (when seeded data matters):

```bash
# Backup: dump local Postgres to a file
pg_dump "$LOCAL_DATABASE_URL" > /tmp/revampit-dev-$(date +%Y%m%d).sql

# Restore:
psql "$LOCAL_DATABASE_URL" < /tmp/revampit-dev-20260603.sql
```

Local dev DOES NOT touch Neon. Treat `.env.local`'s `DATABASE_URL` carefully — it points at prod.

## What's NOT in this plan

- **Replication failover** — single-region Neon (eu-central-1). If the AZ goes down, we wait for Neon to restore. Multi-region would change the cost model significantly.
- **Database snapshot exports** — Neon's PITR is the only mechanism today. Manual `pg_dump` of prod is one-shot snapshots for compliance audits, not for recovery.
- **Hot standby** — N/A on Neon free tier; available on paid.

## Drill cadence

Run a full recovery drill **once per quarter**:

1. Pick an arbitrary recovery point ~24h old.
2. Restore to a new branch (don't touch prod).
3. Run steps 4–6 (skip step 3 since we keep prod URL).
4. Time the procedure. If > 1 hour, investigate.
5. Document any surprises in the runbook.

---

**Last reviewed:** 2026-06-03 — initial publication.
**Next drill due:** 2026-09-03.
