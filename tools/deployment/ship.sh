#!/usr/bin/env bash
set -euo pipefail

# Ship = validate -> build -> test -> deploy -> monitor
# Keeps user flow tight: fewest clicks, clear path.

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $*${NC}"; }
log_ok()   { echo -e "${GREEN}✅ $*${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $*${NC}"; }
log_err()  { echo -e "${RED}❌ $*${NC}"; }

log_info "🚢 Ship: start checks → tests → deploy"

# 1) Spin up required local services (db/cache/search) for dev/e2e when needed
if command -v docker &>/dev/null; then
  log_info "Starting local services (db/redis/search)"
  npm run services:up || log_warn "Services not fully required for all tests; continuing"
else
  log_warn "Docker not available; skipping services:up"
fi

# 2) Lint + strict typecheck
log_info "Running lint"
npm run lint

if npx --yes tsc -v >/dev/null 2>&1; then
  log_info "Running TypeScript typecheck (no emit)"
  npx tsc -p tsconfig.json --noEmit
else
  log_warn "TypeScript not available; skipping typecheck"
fi

# 3) Build (Next + sitemap)
log_info "Building application"
npm run build

# 4) Unit tests
if npm run -s | grep -q "test"; then
  log_info "Running unit tests"
  npm run test
else
  log_warn "No unit test script; skipping"
fi

# 5) E2E smoke (Playwright) — uses dev server from playwright.config
if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then
  log_info "Running Playwright E2E tests"
  # Keep reporter simple in CI-like runs
  npx playwright test --reporter=list || {
    log_err "E2E tests failed"
    exit 1
  }
else
  log_warn "No Playwright config found; skipping e2e"
fi

log_ok "Local validation passed. Triggering deployment + monitoring"

# 6) Deploy via canonical script (handles PR/merge/Vercel monitoring)
exec bash "$(dirname "$0")/deploy.sh"

