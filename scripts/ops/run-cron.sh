#!/usr/bin/env bash
# Trigger a self-hosted cron endpoint on the local app. Replaces the 4 cron jobs
# that ran on Vercel before the self-host cutover (close-decisions,
# close-it-hilfe-requests, prune-audit-log, wake-recurring-tasks). Scheduled by
# the revampit-cron@<job>.timer units. Source of truth: scripts/ops/ in the repo.
#
# Usage: run-cron.sh <endpoint>      e.g. run-cron.sh close-decisions
set -euo pipefail

ENDPOINT="${1:?usage: run-cron.sh <endpoint>}"
APP_ENV="${APP_ENV:-/opt/revampit/app/.env}"
PORT="${PORT:-4004}"

# CRON_SECRET (if set) authenticates the call as `Authorization: Bearer <secret>`;
# the routes skip the auth check only when CRON_SECRET is unset.
SECRET="$(grep -E '^CRON_SECRET=' "$APP_ENV" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' || true)"
hdr=()
[ -n "${SECRET:-}" ] && hdr=(-H "Authorization: Bearer ${SECRET}")

out="$(mktemp)"; trap 'rm -f "$out"' EXIT
code="$(curl -s -o "$out" -w '%{http_code}' --max-time 120 "${hdr[@]}" \
  "http://localhost:${PORT}/api/cron/${ENDPOINT}")"
echo "cron ${ENDPOINT} → HTTP ${code}: $(head -c 300 "$out")"
[ "$code" = "200" ] || { echo "ERROR: cron ${ENDPOINT} returned ${code}"; exit 1; }
