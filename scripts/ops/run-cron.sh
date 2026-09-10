#!/usr/bin/env bash
# Trigger a self-hosted cron endpoint on the local app. Replaces the 4 cron jobs
# that ran on Vercel before the self-host cutover (close-decisions,
# close-it-hilfe-requests, prune-audit-log, wake-recurring-tasks). Scheduled by
# the evig-cron@<job>.timer units. Source of truth: scripts/ops/ in the repo.
#
# Usage: run-cron.sh <endpoint>      e.g. run-cron.sh close-decisions
set -euo pipefail

ENDPOINT="${1:?usage: run-cron.sh <endpoint>}"
APP_ENV="${APP_ENV:-/opt/evig/app/.env}"
PORT="${PORT:-4004}"

# The app is not listening the instant its unit starts. `After=evig-app.service`
# orders these timers after the app unit's *start*, never its readiness, and
# `Persistent=true` makes systemd fire every schedule missed while the box was
# off the moment it comes back.
#
# 2026-09-10: the box booted at 08:01:48 UTC. timecard-reminders (due 08:00)
# caught up at 08:01:58, evig-app.service started the same second, and Next only
# bound :4004 at 08:02:00. curl got connection-refused, `set -e` turned curl's
# exit 7 into the script's exit status, and because this is a *daily* timer the
# unit then sat in `failed` for the next 24h — paging the operator over a
# two-second race, and silently skipping that day's reminders entirely.
#
# So retry ONLY curl's connection-refused (exit 7 — the exact signature of "the
# app is still coming up"). A real HTTP status still fails on the first
# response, so a broken endpoint stays exactly as loud as it was. The whole
# retry budget is bounded well inside the unit's TimeoutStartSec=180.
RETRY_ATTEMPTS="${RETRY_ATTEMPTS:-10}"
RETRY_SLEEP_SECS="${RETRY_SLEEP_SECS:-6}"

# CRON_SECRET (if set) authenticates the call as `Authorization: Bearer <secret>`;
# the routes skip the auth check only when CRON_SECRET is unset.
SECRET="$(grep -E '^CRON_SECRET=' "$APP_ENV" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' || true)"
hdr=()
# An `x && y` one-liner here would be the script's exit status when SECRET is
# empty, and `set -e` would kill the run before it ever called curl.
if [ -n "${SECRET:-}" ]; then
  hdr=(-H "Authorization: Bearer ${SECRET}")
fi

out="$(mktemp)"; trap 'rm -f "$out"' EXIT

attempt=1
while :; do
  rc=0
  code="$(curl -s -o "$out" -w '%{http_code}' --max-time 120 "${hdr[@]}" \
    "http://localhost:${PORT}/api/cron/${ENDPOINT}")" || rc=$?
  [ "$rc" -eq 7 ] && [ "$attempt" -lt "$RETRY_ATTEMPTS" ] || break
  echo "cron ${ENDPOINT}: :${PORT} refused the connection (attempt ${attempt}/${RETRY_ATTEMPTS}) — app still starting, retrying in ${RETRY_SLEEP_SECS}s"
  sleep "$RETRY_SLEEP_SECS"
  attempt=$((attempt + 1))
done

if [ "$rc" -ne 0 ]; then
  echo "ERROR: cron ${ENDPOINT} could not reach http://localhost:${PORT} after ${attempt} attempt(s) (curl exit ${rc})"
  exit "$rc"
fi

echo "cron ${ENDPOINT} → HTTP ${code}: $(head -c 300 "$out")"
[ "$code" = "200" ] || { echo "ERROR: cron ${ENDPOINT} returned ${code}"; exit 1; }
