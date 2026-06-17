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
ssh -o BatchMode=yes "$BOX" "sudo mkdir -p '$REMOTE_RELEASE' && sudo chown -R \"\$(id -u):\$(id -g)\" '$REMOTE_RELEASES'"
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
