#!/usr/bin/env bash
# The box paths baked into scripts/ops/ must match where the deploy actually puts
# the app.
#
# 2026-09-02: renaming /opt/revampit -> /opt/evig on the box updated the deploy
# script but not the systemd units, whose ExecStart is a literal path (systemd
# cannot interpolate one). Every unit kept spawning /opt/revampit/ops/run-cron.sh,
# which no longer existed: all five cron timers and the nightly off-box DB backup
# died with status=203/EXEC, and nothing said so until a timer happened to fire.
#
# The deploy script is the single source of truth for the box root. This compares
# every /opt/<name> literal under scripts/ops/ against it, so the next rename
# fails CI instead of failing silently at 03:32 UTC.
set -uo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)" || exit 1

DEPLOY=scripts/selfhost-deploy-evig.sh
[ -f "$DEPLOY" ] || { echo "FAIL: $DEPLOY not found — did the deploy script get renamed?"; exit 1; }

NAME="$(grep -oP '^NAME=\K\S+' "$DEPLOY" | head -1)"
[ -n "$NAME" ] || { echo "FAIL: no NAME= in $DEPLOY"; exit 1; }
EXPECTED="/opt/$NAME"

bad=0
while IFS= read -r hit; do
  echo "  $hit"
  bad=$((bad + 1))
done < <(grep -rn '/opt/[a-z0-9_-]\+' scripts/ops/ | grep -v "$EXPECTED")

if [ "$bad" -gt 0 ]; then
  echo
  echo "FAIL: $bad path(s) in scripts/ops/ do not point at $EXPECTED (from NAME= in $DEPLOY)."
  echo "      A unit whose ExecStart names a directory that does not exist fails 203/EXEC."
  exit 1
fi

echo "ops box paths: OK — every /opt path under scripts/ops/ is $EXPECTED"
