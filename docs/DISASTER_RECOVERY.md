# Disaster recovery — self-hosted Hetzner box

**Scope:** Recovery of the production stack running on the single Hetzner box
(`ubuntu@167.233.22.31`): Postgres, file uploads, and the Next.js app. The DB
recovery source is the **nightly off-box backup in Cloudflare R2** — no cloud
hosted DB PITR; app deploys via GitHub Actions (not Vercel).

## Architecture at a glance

| Component | Where it runs | How it's protected |
|---|---|---|
| **Prod DB** | Self-hosted Postgres 17 on the box, `DATABASE_URL=postgresql://…@localhost:5432/revampit` | Nightly `pg_dump` → R2 `revampit-backups` (`db/…dump`), 30-day retention |
| **New product/listing images** | Cloudflare R2 bucket `revampit-media` (durable, off-box) | Lives off-box already — not lost if the box dies |
| **Legacy disk uploads** | `/opt/revampit/uploads` (symlinked into each release's `public/uploads`) | Nightly tar → R2 `revampit-backups` (`uploads/…tar.gz`), 30-day retention |
| **App code + build** | GitHub repo → GitHub Actions standalone build → rsync to box | git history + reproducible deploy workflow |
| **Runtime env** | `/opt/revampit/app/.env` (root-owned, NOT in git) | Manual secret — keep an off-box copy in the password vault |
| **Search index** | Meilisearch (localhost Docker container) | Disposable — reindexed from the DB, not a recovery target |

**What's protected where (the short version):**

- **DB → R2 nightly** (`revampit-backups`, custom-format `pg_dump`).
- **New images → R2 `revampit-media`** (already off-box; durable).
- **Code → git + GitHub Actions** (rebuild + redeploy from `main`).
- **Legacy uploads → R2 nightly tar** (`revampit-backups`).

## Targets (RTO / RPO)

| Metric | Target | Why |
|---|---|---|
| **RPO** (max data loss) | **up to ~24h** | DB recovery point is the last nightly dump (03:30 UTC). Anything committed after the most recent dump is lost on a full DB-loss restore. There is **no continuous backup / PITR** on this box. |
| **RTO** (time to recover) | **~1–3h for DB/uploads loss; up to a day for total box loss** | DB restore from R2 is minutes once the dump is downloaded. A from-scratch box rebuild (provision host, install Postgres, restore dump + uploads, redeploy app) is the long pole. |
| **Backup retention** | 30 days | R2 lifecycle on `revampit-backups`. |

There is **no hot standby and no replication** configured. Recovery is
restore-from-backup, not failover.

## The nightly backup (recovery source)

A systemd timer `revampit-backup.timer` runs `scripts/ops/backup-db-to-r2.sh`
nightly at **03:30 UTC**. Each run:

1. `pg_dump --format=custom` of `revampit` (as the `postgres` superuser via peer auth),
2. tars `/opt/revampit/uploads`,
3. validates the dump with `pg_restore --list` and uploads both to the **private**
   R2 bucket `revampit-backups` (keys `db/…dump` and `uploads/…tar.gz`), with size
   verification and retry on transient errors.

Credentials come from the same `S3_*` keys already in `/opt/revampit/app/.env`
(one R2 token covers every bucket). **Full operational detail — hardening,
install/update on the box, the pinned `@aws-sdk` — lives in
`scripts/ops/README.md`. Do not duplicate it here; read it there.**

### Health check (is the backup actually running?)

List the bucket and look at the newest `db/` object's timestamp. **Older than
~26h = last night's run failed** — investigate before you need the backup.

```bash
# On the box (S3_* creds are in /opt/revampit/app/.env):
ssh ubuntu@167.233.22.31
sudo systemctl status revampit-backup.timer        # next/last run
sudo journalctl -u revampit-backup.service -n 40 --no-pager
```

---

## Runbook A — Database loss / corruption (restore from R2)

Use when the DB is corrupt, dropped, or a bad migration/data event needs a
rollback to last night.

### Step 1 — Decide the recovery point

The only restore points are nightly dumps in `revampit-backups` under `db/`.
Pick the newest known-good one (almost always last night's). Everything committed
after that dump's 03:30 UTC stamp will be lost — that is the RPO trade-off.

### Step 2 — Fetch the dump from R2

```bash
ssh ubuntu@167.233.22.31
set -a; source /opt/revampit/app/.env; set +a   # loads S3_* + DATABASE_URL

# List available dumps (newest last). Uses the app's pinned aws-sdk helper or aws cli.
# Then download the chosen object, e.g.:
#   db/revampit-db-2026-06-19T0330.dump  →  ./revampit-db-2026-06-19.dump
```

(The R2 object listing/fetch uses the same `S3_*` creds; `scripts/ops/README.md`
documents the helper used by the backup job.)

### Step 3 — Restore

```bash
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" revampit-db-<stamp>.dump
```

`--clean --if-exists` drops existing objects first; `--no-owner` avoids needing
the original role grants (the app DB user is not a superuser).

### Step 4 — Verify schema + data

```bash
# schema_migrations intact?
psql "$DATABASE_URL" -tA -c "SELECT COUNT(*) FROM schema_migrations"

# Spot-check critical row counts:
psql "$DATABASE_URL" -tA -c "
  SELECT 'users:'     || COUNT(*) FROM users
  UNION ALL SELECT 'listings:'   || COUNT(*) FROM listings
  UNION ALL SELECT 'inventory:'  || COUNT(*) FROM inventory_items
  UNION ALL SELECT 'donations:'  || COUNT(*) FROM donations
  UNION ALL SELECT 'projects:'   || COUNT(*) FROM projects
"
```

If the dump predates the deployed code's expected schema, apply any newer
migrations (the runner only applies un-tracked files):

```bash
cd /opt/revampit/app && bash scripts/db/run-migration.sh
```

### Step 5 — Restart + smoke-test

```bash
sudo systemctl restart revampit-app
```

1. `/api/health` returns 200 with `{ database: 'ok' }`.
2. Log in as `andreas@revamp-it.ch` (super admin) — dashboard renders.
3. `/marketplace` — listings load.
4. `/projects/upcycling` — live needs feed renders (DB roundtrip).

If anything fails, **do not** mark recovery complete: restore an earlier dump or
escalate.

### What's lost in a DB restore

| Surface | Lost? |
|---|---|
| Rows committed after the dump timestamp | **YES** — the RPO trade-off |
| New images in R2 `revampit-media` | NO — separate bucket, untouched |
| Legacy uploads on disk | NO — separate restore (Runbook B) |
| Auth.js JWT sessions | NO — stateless; logged-in users stay logged in |
| Rows in the `sessions` table | YES — those users re-log-in |

---

## Runbook B — Uploads loss (`/opt/revampit/uploads`)

Use when the legacy disk uploads dir is lost (disk failure, accidental delete).
New images are in R2 `revampit-media` and are **not** affected — this only
restores the legacy on-disk files.

```bash
ssh ubuntu@167.233.22.31
set -a; source /opt/revampit/app/.env; set +a

# Download the chosen uploads tar from R2 (key: uploads/revampit-uploads-<stamp>.tar.gz)
sudo mkdir -p /opt/revampit/uploads
sudo tar -xzf revampit-uploads-<stamp>.tar.gz -C /opt/revampit/uploads --strip-components=1
sudo chown -R ubuntu:ubuntu /opt/revampit/uploads
```

`/opt/revampit/uploads` is the persistent dir symlinked into each release's
`public/uploads`, so no app change is needed once the files are back. Verify a
known legacy image URL loads, then you're done.

---

## Runbook C — App / deploy failure (rollback)

Deploys run via GitHub Actions (`.github/workflows/deploy-selfhost.yml`): push to
`main` → build standalone → rsync to box → restart `revampit-app` behind a
**page-render rollback gate**. A failed health/page check auto-rolls-back to the
previous release.

### Auto-rollback (the normal case)

The deploy keeps the prior release at `/opt/revampit/app.previous` and, on a
failed health/page check, swaps it back automatically. In most failed deploys you
do nothing — the box self-heals to the last good release. Confirm:

```bash
ssh ubuntu@167.233.22.31
sudo systemctl status revampit-app
curl -sf http://localhost:4004/api/health
```

### Manual rollback (if auto-rollback didn't fire)

```bash
ssh ubuntu@167.233.22.31
ls -dt /opt/revampit/releases/*/    # last ~5 releases retained, newest first

# Point the app symlink at the previous good release and restart:
sudo ln -sfn /opt/revampit/app.previous /opt/revampit/app   # or a chosen releases/<stamp>
sudo systemctl restart revampit-app
curl -sf http://localhost:4004/api/health
```

### Forward fix

If the bug is in code, fix on a branch, merge to `main`, and let GitHub Actions
redeploy. Do **not** hand-edit files on the box — they're overwritten on the next
deploy and drift from git (the SSOT).

---

## Runbook D — Total box loss (rebuild from scratch)

Worst case: the Hetzner box is gone. Recovery sources: R2 backups (DB + legacy
uploads), R2 `revampit-media` (new images, untouched), git (code), and the env
secret from the vault.

1. **Provision** a new host; install Postgres 17, Docker (for Meilisearch), Node.
2. **Restore env**: place the off-box copy of `/opt/revampit/app/.env` (vault).
3. **Restore DB**: create the `revampit` DB, then Runbook A steps 2–4 (R2 → `pg_restore`).
4. **Restore legacy uploads**: Runbook B (R2 tar → `/opt/revampit/uploads`).
5. **Deploy app**: trigger the GitHub Actions deploy at `main` (rsync standalone build + systemd unit).
6. **Reindex search**: rebuild Meilisearch from the DB (it's disposable; not a backup target).
7. **Repoint DNS** to the new box IP.
8. **Smoke-test** per Runbook A step 5.

New product/listing images need no restore — they're served from R2
`revampit-media`, which the box never owned.

---

## Post-incident

Within 24h of any recovery, file an incident report at
`docs/incidents/YYYY-MM-DD-<short-name>.md`: root cause, recovery time, data loss
(if any), and prevention work.

## Drill cadence

Run a restore drill **once per quarter**:

1. Download last night's `db/` dump from `revampit-backups`.
2. `pg_restore` it into a **throwaway** local DB (never prod).
3. Run the Step 4 verification queries; confirm counts look sane.
4. Time it. If the procedure is unclear or slow, fix this runbook.

## What's NOT in this plan

- **Hot standby / replication** — not configured. Recovery is restore-from-backup.
- **Continuous backup / PITR** — not available; granularity is the nightly dump (RPO up to ~24h).
- **Multi-region** — single box, single region.
- **Real-time backup-failure alerts** — none wired (no email/Slack credential on the box). Health is the manual "newest `db/` object age" check; wire `OnFailure=` if alerting is added.

---

**Last reviewed:** 2026-06-25 — self-hosted Hetzner + R2 architecture; cloud DB retired.
**Next drill due:** 2026-09-19.
