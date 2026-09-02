# Ops scripts

Box-side operations that are **not** part of the app build, so the deploy
(`scripts/selfhost-deploy-evig.sh`, which only rsyncs the standalone build)
does not ship them. They are version-controlled here as the source of truth and
installed onto the box once with the block below; re-run it after editing.

> **The box directory is `/opt/evig`.** systemd unit files cannot interpolate a
> variable into `ExecStart`, so that path is a literal in every file here. It
> must equal `REMOTE_BASE` in `scripts/selfhost-deploy-evig.sh` — if the two ever
> disagree, the timers spawn a binary that does not exist (`status=203/EXEC`) and
> every cron job plus the nightly backup dies silently until someone reads a
> journal. `npm run lint:ops` compares them, so CI fails instead. Renaming the
> box directory therefore means: rename it, update the deploy script, update the
> files here, and re-run the install blocks below in the same change.
>
> The unit *names* are still `revampit-*`. That rename touches a live schedule
> and is a separate, deliberate step — the paths inside them are what has to be
> right.

## Nightly backups → R2 (`backup-db-to-r2.sh`)

The prod Postgres lives on the Hetzner box only, so a nightly
off-box copy is the safety net. The job `pg_dump`s the DB (custom format) and
tars `/opt/evig/uploads`, then pushes both to the **private** R2 bucket
`revampit-backups` with 30-day retention. Credentials are read from the app's
own `/opt/evig/app/.env` (the same `S3_*` keys used for image upload — one
R2 token covers every bucket), so there is nothing extra to configure.

**Hardening (why it won't silently fail):**
- Dump is validated with `pg_restore --list` and a non-empty check *before* upload —
  a truncated/corrupt dump aborts the run instead of being stored.
- Upload retries 4× with backoff (plus SDK-level `maxAttempts`), then **verifies**
  the stored object's size via `HeadObject`. A short/0-byte upload fails loudly.
- Runs against the backup's **own pinned `@aws-sdk`** in `ops/node_modules`, so an
  app redeploy (or future tree-shake) can't break it; it falls back to the app's
  copy only if the pinned one is missing.
- `Persistent=true` catches a run missed while the box was off. Prune is
  best-effort — it can never fail a backup whose copy is already stored.

**Health check (no external monitor needed):** list the bucket and look at the
newest `db/` object's timestamp — older than ~26h means last night's run failed.
Real-time push alerts would need an email/Slack credential (none configured); add
one and wire `OnFailure=` if you want them.

Restore a DB dump:

```bash
# copy the chosen dump down, then:
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" revampit-db-<stamp>.dump
```

### Install / update on the box

```bash
BOX=ubuntu@167.233.22.31
ssh "$BOX" 'sudo mkdir -p /opt/evig/ops'
rsync -az -e ssh \
  scripts/ops/backup-db-to-r2.sh scripts/ops/r2-backup-upload.cjs \
  "$BOX:/tmp/ops/"
ssh "$BOX" '
  sudo mv /tmp/ops/* /opt/evig/ops/ && rmdir /tmp/ops
  sudo chmod +x /opt/evig/ops/backup-db-to-r2.sh
'
# Pin the backup its OWN aws-sdk (once) so app redeploys can never break it:
ssh "$BOX" '
  cd /opt/evig/ops
  sudo bash -c "[ -f package.json ] || npm init -y >/dev/null; npm install @aws-sdk/client-s3@^3 --no-audit --no-fund --silent"
'
# systemd units
rsync -az -e ssh \
  scripts/ops/revampit-backup.service scripts/ops/revampit-backup.timer \
  "$BOX:/tmp/"
ssh "$BOX" '
  sudo mv /tmp/revampit-backup.service /tmp/revampit-backup.timer /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable --now revampit-backup.timer
'
# verify with a one-off run
ssh "$BOX" 'sudo systemctl start revampit-backup.service && journalctl -u revampit-backup.service -n 20 --no-pager'
```

## Self-hosted crons (`run-cron.sh` + `revampit-cron@<job>.timer`)

The 4 cron jobs that ran on Vercel before the cutover are now systemd timers on
the box (Vercel no longer runs anything). `run-cron.sh <endpoint>` curls
`http://localhost:4004/api/cron/<endpoint>` with `Authorization: Bearer
$CRON_SECRET` (read from `/opt/evig/app/.env`) and fails non-zero on any
non-200, so a failed run shows up in `systemctl`/journald.

| Timer | Endpoint | Schedule (UTC) |
|---|---|---|
| `revampit-cron@close-decisions.timer`         | `/api/cron/close-decisions`         | 00:00 |
| `revampit-cron@close-it-hilfe-requests.timer` | `/api/cron/close-it-hilfe-requests` | 01:00 |
| `revampit-cron@prune-audit-log.timer`         | `/api/cron/prune-audit-log`         | 02:00 |
| `revampit-cron@wake-recurring-tasks.timer`    | `/api/cron/wake-recurring-tasks`    | 07:00 |
| `revampit-cron@timecard-reminders.timer`      | `/api/cron/timecard-reminders`      | 08:00 |
| `revampit-cron@release-escrow.timer`          | `/api/cron/release-escrow`          | 04:00 † |

† `release-escrow` is the one timer in this directory that is **not** enabled
on the box — enabling it starts releasing escrow on a schedule, so it is a
deliberate go/no-go, not something the install block should switch on by
accident. Every other timer here is installed and running.

`CRON_SECRET` must be set in `/opt/evig/app/.env` (without it the routes skip
auth and are publicly triggerable). It is preserved across deploys (the deploy
excludes `.env` from rsync and copies the existing one forward).

### Install / update on the box

```bash
BOX=ubuntu@167.233.22.31
rsync -az -e ssh scripts/ops/run-cron.sh "$BOX:/tmp/" && \
  ssh "$BOX" 'sudo mv /tmp/run-cron.sh /opt/evig/ops/ && sudo chmod +x /opt/evig/ops/run-cron.sh'
rsync -az -e ssh scripts/ops/revampit-cron@*.service scripts/ops/revampit-cron@*.timer "$BOX:/tmp/"
ssh "$BOX" '
  sudo mv /tmp/revampit-cron@*.service /tmp/revampit-cron@*.timer /etc/systemd/system/
  sudo systemctl daemon-reload
  # release-escrow is deliberately absent — see the † note above.
  for j in close-decisions close-it-hilfe-requests prune-audit-log wake-recurring-tasks timecard-reminders; do
    sudo systemctl enable --now "revampit-cron@$j.timer"
  done
'
# one-off test: sudo systemctl start revampit-cron@close-decisions.service && journalctl -u revampit-cron@close-decisions.service -n5
```
