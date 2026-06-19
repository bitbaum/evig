# Ops scripts

Box-side operations that are **not** part of the app build, so the deploy
(`scripts/selfhost-deploy-revampit.sh`, which only rsyncs the standalone build)
does not ship them. They are version-controlled here as the source of truth and
installed onto the box once with the block below; re-run it after editing.

## Nightly backups → R2 (`backup-db-to-r2.sh`)

The prod Postgres lives only on the Hetzner box now (Neon retired), so a nightly
off-box copy is the safety net. The job `pg_dump`s the DB (custom format) and
tars `/opt/revampit/uploads`, then pushes both to the **private** R2 bucket
`revampit-backups` with 30-day retention. Credentials are read from the app's
own `/opt/revampit/app/.env` (the same `S3_*` keys used for image upload — one
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
ssh "$BOX" 'sudo mkdir -p /opt/revampit/ops'
rsync -az -e ssh \
  scripts/ops/backup-db-to-r2.sh scripts/ops/r2-backup-upload.cjs \
  "$BOX:/tmp/ops/"
ssh "$BOX" '
  sudo mv /tmp/ops/* /opt/revampit/ops/ && rmdir /tmp/ops
  sudo chmod +x /opt/revampit/ops/backup-db-to-r2.sh
'
# Pin the backup its OWN aws-sdk (once) so app redeploys can never break it:
ssh "$BOX" '
  cd /opt/revampit/ops
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
