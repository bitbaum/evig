#!/usr/bin/env bash
# Dual-persona feature inventory against production (or PLAYWRIGHT_BASE_URL).
#
# Requires AUTH_TEST_USER_PASSWORD and AUTH_TEST_ADMIN_PASSWORD.
# Optional: AUTH_TEST_USER_EMAIL, AUTH_TEST_ADMIN_EMAIL, PLAYWRIGHT_BASE_URL.
#
# Used by GitHub Actions post-deploy and manual: npm run test:e2e:inventory:prod

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BASE_URL="${PLAYWRIGHT_BASE_URL:-https://revampit.orangecat.ch}"

if [ -z "${AUTH_TEST_USER_PASSWORD:-}" ] || [ -z "${AUTH_TEST_ADMIN_PASSWORD:-}" ]; then
  echo "AUTH_TEST_USER_PASSWORD and AUTH_TEST_ADMIN_PASSWORD not set — skipping inventory smoke."
  exit 0
fi

echo "=== wait for ${BASE_URL}/api/health ==="
ready=0
for _ in 1 2 3 4 5 6; do
  if curl -sf --max-time 15 "${BASE_URL}/api/health" >/dev/null; then
    ready=1
    break
  fi
  sleep 10
done
if [ "$ready" -ne 1 ]; then
  echo "ERROR: ${BASE_URL}/api/health did not become ready"
  exit 1
fi

export PLAYWRIGHT_BASE_URL="$BASE_URL"
# No hardcoded user default — the old butaeff@gmail.com test account was removed.
# Set AUTH_TEST_USER_EMAIL to a real non-admin account (ideally against a staging
# URL, since these journeys mutate data). The admin default is a real account.
export AUTH_TEST_USER_EMAIL="${AUTH_TEST_USER_EMAIL:?set AUTH_TEST_USER_EMAIL to a real non-admin account}"
export AUTH_TEST_ADMIN_EMAIL="${AUTH_TEST_ADMIN_EMAIL:-georgy.butaev@revamp-it.ch}"

echo "=== dual-persona inventory smoke → ${BASE_URL} ==="
npx playwright test tests/e2e/feature-inventory.spec.ts --project=chromium --reporter=line

# The MUTATING journey specs (it-hilfe, marketplace checkout, workshops,
# service appointments, timecards, intake, tasks, protocols, decisions, cms,
# hr) no longer run against production from here: they create/submit/approve
# real rows and depend on fixture accounts/data prod doesn't have (the
# service-appointment journey needs the user persona to BE a technician).
# They run against the seeded ephemeral environment in CI (e2e-local job)
# instead. Production keeps the read-only dual-persona route inventory above.
