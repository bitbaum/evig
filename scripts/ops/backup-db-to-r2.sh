#!/usr/bin/env bash
# Nightly OFF-BOX backup. Prod Postgres lives on this Hetzner box only —
# this is the off-box safety net: dump the DB and tar the local uploads dir,
# the local uploads dir, then push both to the PRIVATE R2 bucket
# `revampit-backups`. Retention is enforced in the uploader (RETENTION_DAYS).
#
# Installed at /opt/revampit/ops/ and run by the revampit-backup.timer (root,
# so it can read the root-owned app/.env). Source of truth lives in the repo at
# scripts/ops/ — re-run the install block in scripts/ops/README.md to update.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/revampit/app}"
OPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$APP_DIR/.env"
UPLOADS_DIR="${UPLOADS_DIR:-/opt/revampit/uploads}"

[ -r "$ENV_FILE" ] || { echo "ERROR: cannot read $ENV_FILE (run as root)"; exit 1; }

# Pull only the keys we need from the app env (don't export the whole file).
get() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
export DATABASE_URL S3_ENDPOINT S3_REGION S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY APP_DIR
DATABASE_URL="$(get DATABASE_URL)"
S3_ENDPOINT="$(get S3_ENDPOINT)"
S3_REGION="$(get S3_REGION)"
S3_ACCESS_KEY_ID="$(get S3_ACCESS_KEY_ID)"
S3_SECRET_ACCESS_KEY="$(get S3_SECRET_ACCESS_KEY)"
export BACKUP_BUCKET="${BACKUP_BUCKET:-revampit-backups}"
export RETENTION_DAYS="${RETENTION_DAYS:-30}"
# Prefer the backup's OWN pinned SDK (installed once in ops/), independent of
# app redeploys; the uploader falls back to the app's copy if this is absent.
export SDK_DIR="${SDK_DIR:-/opt/revampit/ops/node_modules/@aws-sdk/client-s3}"

[ -n "$DATABASE_URL" ]  || { echo "ERROR: DATABASE_URL empty in $ENV_FILE"; exit 1; }
[ -n "$S3_ENDPOINT" ]   || { echo "ERROR: S3_ENDPOINT empty in $ENV_FILE"; exit 1; }

# Database name from the URL; the dump itself runs as the postgres superuser via
# local peer auth (below), not this URL — the app role lacks USAGE on the drizzle
# schema, so only the superuser can dump the whole cluster object.
DB_NAME="$(printf '%s' "$DATABASE_URL" | sed -E 's#.*/([^/?]+).*#\1#')"
[ -n "$DB_NAME" ] || { echo "ERROR: could not parse DB name from DATABASE_URL"; exit 1; }

STAMP="$(date -u +%Y-%m-%dT%H%M%SZ)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 1) Database — custom format is compressed and restorable with pg_restore.
#    Dump as the postgres superuser (peer auth) and stream to a root-owned file
#    so there is no cross-user write into the root temp dir. LC_ALL=C silences
#    the harmless perl locale warnings under sudo.
DB_FILE="$TMP/revampit-db-$STAMP.dump"
echo "→ pg_dump (custom format, as postgres) …"
LC_ALL=C sudo -u postgres pg_dump --format=custom --no-owner --no-privileges -d "$DB_NAME" > "$DB_FILE"
# Never upload a truncated/corrupt dump: it must be non-empty AND a readable
# pg_restore archive. pg_restore --list only parses the file (no DB connection).
[ -s "$DB_FILE" ] || { echo "ERROR: dump is empty — aborting"; exit 1; }
LC_ALL=C pg_restore --list "$DB_FILE" >/dev/null || { echo "ERROR: dump failed validation — aborting"; exit 1; }
echo "  dump validated ($(stat -c %s "$DB_FILE") bytes)"
node "$OPS_DIR/r2-backup-upload.cjs" "$DB_FILE" "db/revampit-db-$STAMP.dump"

# 2) Local uploads — legacy images served from disk. New uploads go to R2
#    (revampit-media), so this only protects the pre-R2 set; still worth it
#    since those files exist nowhere else.
if [ -d "$UPLOADS_DIR" ] && [ -n "$(ls -A "$UPLOADS_DIR" 2>/dev/null)" ]; then
  UP_FILE="$TMP/revampit-uploads-$STAMP.tar.gz"
  echo "→ tar uploads …"
  tar czf "$UP_FILE" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
  node "$OPS_DIR/r2-backup-upload.cjs" "$UP_FILE" "uploads/revampit-uploads-$STAMP.tar.gz"
fi

echo "✓ backup complete @ $STAMP"
