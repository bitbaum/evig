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
export AUTH_TEST_USER_EMAIL="${AUTH_TEST_USER_EMAIL:-butaeff@gmail.com}"
export AUTH_TEST_ADMIN_EMAIL="${AUTH_TEST_ADMIN_EMAIL:-georgy.butaev@revamp-it.ch}"

echo "=== dual-persona inventory smoke → ${BASE_URL} ==="
npx playwright test tests/e2e/feature-inventory.spec.ts --project=chromium --reporter=line

echo "=== IT-Hilfe dual-persona journey → ${BASE_URL} ==="
npx playwright test tests/e2e/it-hilfe-journey.spec.ts --project=chromium --reporter=line
