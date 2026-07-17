#!/usr/bin/env bash
# Deploy RevampIT to revampit.orangecat.ch (Hetzner /opt/revampit/app).
set -euo pipefail

BOX="${BOX:-ubuntu@167.233.22.31}"
NAME=revampit
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_BASE="/opt/$NAME"
REMOTE_APP="$REMOTE_BASE/app"
REMOTE_RELEASES="$REMOTE_BASE/releases"
RELEASE_SHA="${RELEASE_SHA:-$(git rev-parse --short=12 HEAD)}"
RELEASE_TIME="$(date -u +%Y%m%d%H%M%S)"
RELEASE_ID="${RELEASE_SHA}-${RELEASE_TIME}"
REMOTE_RELEASE="$REMOTE_RELEASES/$RELEASE_ID"
cd "$SRC"

[ -f "$SRC/.env.selfhost.local" ] || { echo "ERROR: missing .env.selfhost.local"; exit 1; }

set -a
# shellcheck disable=SC1091
source "$SRC/.env.selfhost.local"
set +a

echo "=== build $NAME@$RELEASE_SHA ==="
NEXT_PUBLIC_BUILD_SHA="$RELEASE_SHA" \
NEXT_PUBLIC_BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
SELF_HOST=1 \
npm run build

ST="$SRC/.next/standalone"
[ -d "$ST" ] || { echo "ERROR: no standalone output"; exit 1; }

# ── Apply pending DB migrations to the PROD Postgres BEFORE activating ──────
# Prod runs its own Postgres on the box. Migrations live in the repo
# and are tracked in schema_migrations. Apply any not-yet-recorded file, in
# order, each in its own transaction with ON_ERROR_STOP — so the schema is ready
# before the new code goes live. A failed migration aborts the deploy and leaves
# the current release untouched. This is the guard against prod schema drift.
# `prod_psql` pipes stdin SQL to the prod DB (host psql if present, else the
# supabase-db container); extra psql flags are passed as args.
prod_psql() {
  ssh -o BatchMode=yes "$BOX" "LC_ALL=C; DB=\$(grep -E '^DATABASE_URL=' '$REMOTE_APP/.env' | cut -d= -f2- | tr -d '\"'); if command -v psql >/dev/null 2>&1; then psql \"\$DB\" $* ; else docker exec -i -e LC_ALL=C supabase-db psql -U postgres -d revampit $* ; fi"
}
# ── Ensure ffmpeg on the box ────────────────────────────────────────────────
# Protocol audio above Groq's 25 MB upload cap is transcoded + segmented
# server-side (src/lib/transcription/segment-audio.ts); that needs ffmpeg.
# Idempotent: installs once, no-ops on every later deploy.
echo "=== ensure ffmpeg on box (chunked audio transcription) ==="
ssh -o BatchMode=yes "$BOX" 'command -v ffmpeg >/dev/null 2>&1 || { sudo DEBIAN_FRONTEND=noninteractive apt-get -qq update && sudo DEBIAN_FRONTEND=noninteractive apt-get -qq install -y --no-install-recommends ffmpeg; }'

echo "=== apply pending migrations → prod DB ==="
applied_list="$(printf '' | prod_psql "-tAc 'SELECT filename FROM schema_migrations'" 2>/dev/null || true)"
for mig in "$SRC"/scripts/db/migrations/*.sql; do
  fname="$(basename "$mig")"
  printf '%s\n' "$applied_list" | grep -qxF "$fname" && continue
  echo "  → applying $fname"
  if ! { echo "BEGIN;"; cat "$mig"; printf "INSERT INTO schema_migrations(filename) VALUES('%s') ON CONFLICT DO NOTHING; COMMIT;\n" "$fname"; } \
       | prod_psql "-v ON_ERROR_STOP=1 -q"; then
    echo "ERROR: migration $fname failed — aborting deploy (current release stays live)"
    exit 1
  fi
done
echo "  migrations up to date"

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cp -r "$ST"/. "$STAGE/"
NEST="$(cd "$STAGE" && find . -maxdepth 4 -name server.js -not -path '*node_modules*' | head -1 | xargs dirname)"

mkdir -p "$STAGE/$NEST/.next/static"
cp -a "$SRC/.next/static/." "$STAGE/$NEST/.next/static/"
[ -d "$SRC/public" ] && cp -a "$SRC/public/." "$STAGE/$NEST/public/"

if [ -d "$SRC/node_modules/@swc/helpers/esm" ]; then
  mkdir -p "$STAGE/$NEST/node_modules/@swc/helpers"
  cp -a "$SRC/node_modules/@swc/helpers/esm" "$STAGE/$NEST/node_modules/@swc/helpers/"
fi

echo "=== rsync release → $REMOTE_RELEASE ==="
ssh -o BatchMode=yes "$BOX" "sudo mkdir -p '$REMOTE_RELEASE' && sudo chown \"\$(id -u):\$(id -g)\" '$REMOTE_RELEASES' && sudo chown -R \"\$(id -u):\$(id -g)\" '$REMOTE_RELEASE'"
rsync -az --delete --partial \
  -e "ssh -o BatchMode=yes -o ServerAliveInterval=15" \
  --exclude '.env' --exclude 'launch.sh' \
  "$STAGE"/ "$BOX:$REMOTE_RELEASE/"

echo "=== activate release $RELEASE_ID ==="
result=$(
  ssh -o BatchMode=yes "$BOX" \
    "NAME='$NAME' APP='$REMOTE_APP' RELEASE='$REMOTE_RELEASE' RELEASES='$REMOTE_RELEASES' bash -s" <<'REMOTE'
set -euo pipefail

NEXT="${APP}.next"
PREV="${APP}.previous"

sudo rm -rf "$NEXT"
sudo cp -a "$RELEASE" "$NEXT"
sudo rm -rf "$PREV"

if sudo test -f "$APP/.env"; then
  sudo cp -a "$APP/.env" "$NEXT/.env"
fi

if sudo test -f "$APP/launch.sh"; then
  sudo cp -a "$APP/launch.sh" "$NEXT/launch.sh"
fi

# Durable user uploads: keep them in ONE stable directory outside the release
# dirs and symlink it into each release's public/uploads, so every deploy shares
# the same store (served by Next at /uploads/*). Free, self-hosted image
# storage — set S3_* later to move to object storage without code changes.
PERSIST_UPLOADS="$(dirname "$APP")/uploads"
sudo mkdir -p "$PERSIST_UPLOADS"
# One-time fold-in: if the current app had real (non-symlink) uploads, move them
# into the persistent store before we switch to the symlink.
if sudo test -d "$APP/public/uploads" && ! sudo test -L "$APP/public/uploads"; then
  sudo cp -an "$APP/public/uploads/." "$PERSIST_UPLOADS/" 2>/dev/null || true
fi
sudo mkdir -p "$NEXT/public"
sudo rm -rf "$NEXT/public/uploads"
sudo ln -sfn "$PERSIST_UPLOADS" "$NEXT/public/uploads"

if sudo test -e "$APP" || sudo test -L "$APP"; then
  sudo mv "$APP" "$PREV"
fi

sudo mv "$NEXT" "$APP"

set +e
sudo systemctl restart "${NAME}-app"
sleep 5
status="$(systemctl is-active "${NAME}-app")"
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 http://localhost:4004/api/health)"
# Also gate on a real PAGE render — /api/health is an API route and stays 200
# even when SSR crashes site-wide (e.g. a provider throwing during render).
page="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 http://localhost:4004/)"
set -e

if [ "$status" != "active" ] || [ "$code" -lt 200 ] || [ "$code" -ge 400 ] || [ "$page" -lt 200 ] || [ "$page" -ge 400 ]; then
  echo "rollback status=$status http=$code page=$page"
  sudo rm -rf "$APP"
  if sudo test -e "$PREV" || sudo test -L "$PREV"; then
    sudo mv "$PREV" "$APP"
    sudo systemctl restart "${NAME}-app" || true
  fi
  exit 1
fi

sudo rm -rf "$PREV"
find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
  | sort -rn \
  | tail -n +6 \
  | cut -d' ' -f2- \
  | xargs -r sudo rm -rf

echo "status=$status http=$code page=$page"
REMOTE
)

echo "RESULT $NAME@$RELEASE_SHA: $result"

echo "Done: https://revampit.orangecat.ch/"
