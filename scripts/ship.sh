#!/bin/bash
# RevampIT quality gate.
# Usage: npm run ship

set -euo pipefail

echo "RevampIT ship gate"
echo "=================="
echo ""

run_step() {
  local label="$1"
  shift

  echo "==> ${label}"
  "$@"
  echo ""
}

run_step "TypeScript" npm run typecheck
run_step "Lint" npm run lint
run_step "SSOT and i18n compliance" npm run compliance
run_step "Unit tests" npm run test -- --runInBand
run_step "Production build" npm run build

echo "Ship gate passed."
