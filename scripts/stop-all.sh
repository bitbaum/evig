#!/bin/bash

# =============================================================================
# RevampIT - Stop All Services
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}[RevampIT]${NC} Stopping all services..."

# Stop Next.js
if [ -f "$PROJECT_DIR/.nextjs.pid" ]; then
    PID=$(cat "$PROJECT_DIR/.nextjs.pid")
    kill $PID 2>/dev/null || true
    rm "$PROJECT_DIR/.nextjs.pid"
fi
pkill -f "next dev" 2>/dev/null || true

# Stop Medusa
if [ -f "$PROJECT_DIR/.medusa.pid" ]; then
    PID=$(cat "$PROJECT_DIR/.medusa.pid")
    kill $PID 2>/dev/null || true
    rm "$PROJECT_DIR/.medusa.pid"
fi
pkill -f "medusa develop" 2>/dev/null || true

# Optionally stop Docker (uncomment if needed)
# cd "$PROJECT_DIR"
# docker compose down

echo -e "${GREEN}✓${NC} All application services stopped"
echo -e "${BLUE}Note:${NC} Docker containers (databases, Redis, Meilisearch) are still running"
echo -e "      Run 'docker compose down' to stop infrastructure"
