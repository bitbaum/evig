#!/usr/bin/env bash
# Dual-persona feature inventory against production (or PLAYWRIGHT_BASE_URL).
#
# Requires AUTH_TEST_USER_PASSWORD and AUTH_TEST_ADMIN_PASSWORD, plus
# AUTH_TEST_USER_EMAIL and AUTH_TEST_ADMIN_EMAIL for the two personas.
# Optional: PLAYWRIGHT_BASE_URL.
#
# Used by GitHub Actions post-deploy and manual: npm run test:e2e:inventory:prod

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BASE_URL="${PLAYWRIGHT_BASE_URL:-https://evig.orangecat.ch}"

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
# Neither persona address has a default. Both are real accounts on the target
# deployment, so a baked-in default would do two bad things at once: publish a
# person's address in a public repo, and silently drive this suite as whoever
# that is when the variable is missing. In CI both come from the repository
# secrets of the same name; locally, export them yourself. Prefer a staging
# PLAYWRIGHT_BASE_URL — the journeys beyond the read-only inventory mutate data.
export AUTH_TEST_USER_EMAIL="${AUTH_TEST_USER_EMAIL:?set AUTH_TEST_USER_EMAIL (repo secret AUTH_TEST_USER_EMAIL) to the non-admin E2E account}"
export AUTH_TEST_ADMIN_EMAIL="${AUTH_TEST_ADMIN_EMAIL:?set AUTH_TEST_ADMIN_EMAIL (repo secret AUTH_TEST_ADMIN_EMAIL) to the staff/admin E2E account}"

echo "=== dual-persona inventory smoke → ${BASE_URL} ==="
pnpm exec playwright test tests/e2e/feature-inventory.spec.ts --project=chromium --reporter=line

# The MUTATING journey specs (it-hilfe, marketplace checkout, workshops,
# service appointments, timecards, intake, tasks, protocols, decisions, cms,
# hr) no longer run against production from here: they create/submit/approve
# real rows and depend on fixture accounts/data prod doesn't have (the
# service-appointment journey needs the user persona to BE a technician).
# They run against the seeded ephemeral environment in CI (e2e-local job)
# instead. Production keeps the read-only dual-persona route inventory above.
