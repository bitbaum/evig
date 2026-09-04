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

run_step "TypeScript" pnpm run typecheck
run_step "Lint" pnpm run lint
run_step "SSOT and i18n compliance" pnpm run compliance
run_step "Unit tests" pnpm run test --runInBand
run_step "Production build" pnpm run build

echo "Ship gate passed."
