#!/usr/bin/env bash
# Read-only post-deploy smoke against production (or SMOKE_BASE_URL).
#
# Deliberately read-only: it never logs in and never mutates prod. It asserts the
# key public pages render (HTTP 200) and the key DB-backed public APIs return
# `"success":true` — which exercises the real queries (technicians, listings,
# workshops, services, stats), catching a broken deploy or schema/query mismatch
# that the page-render gate alone might miss.
#
# The heavier authenticated, mutating dual-persona journeys are NOT run here (they
# pollute prod and depend on test accounts); run them deliberately via
# `npm run test:e2e:inventory:prod` against a staging URL when needed.

set -euo pipefail

BASE_URL="${SMOKE_BASE_URL:-${PLAYWRIGHT_BASE_URL:-https://revampit.orangecat.ch}}"

# Public pages that must render (HTTP 200).
PAGES=(
  /
  /marketplace
  /it-hilfe
  /it-hilfe/techniker
  /workshops
  /blog
  /services
)

# Public DB-backed APIs that must return 200 + `"success":true`.
APIS=(
  /api/health
  /api/technicians
  /api/listings
  /api/workshops
  /api/services
  /api/stats/community
)

echo "=== wait for ${BASE_URL}/api/health ==="
ready=0
for _ in 1 2 3 4 5 6; do
  if curl -sf --max-time 15 "${BASE_URL}/api/health" >/dev/null; then ready=1; break; fi
  sleep 10
done
if [ "$ready" -ne 1 ]; then
  echo "ERROR: ${BASE_URL}/api/health did not become ready"
  exit 1
fi

fails=0

echo "=== pages (expect 200) → ${BASE_URL} ==="
for path in "${PAGES[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "${BASE_URL}${path}")
  if [ "$code" = "200" ]; then
    echo "  ok  ${path} (${code})"
  else
    echo "  FAIL ${path} (${code})"
    fails=$((fails + 1))
  fi
done

echo "=== APIs (expect 200 + success:true) → ${BASE_URL} ==="
for path in "${APIS[@]}"; do
  body=$(mktemp)
  code=$(curl -s -o "$body" -w "%{http_code}" --max-time 20 "${BASE_URL}${path}")
  if [ "$code" = "200" ] && grep -q '"success":true' "$body"; then
    echo "  ok  ${path} (${code})"
  else
    echo "  FAIL ${path} (${code}, success!=true)"
    fails=$((fails + 1))
  fi
  rm -f "$body"
done

if [ "$fails" -ne 0 ]; then
  echo "=== smoke FAILED: ${fails} check(s) failed ==="
  exit 1
fi
echo "=== smoke OK: all $(( ${#PAGES[@]} + ${#APIS[@]} )) checks passed ==="
