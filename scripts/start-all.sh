#!/bin/bash

# =============================================================================
# RevampIT - Unified Startup Script
# =============================================================================
# Starts all services in the correct order with health checks
# Usage: ./scripts/start-all.sh [--no-medusa] [--stop]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MEDUSA_PORT="${MEDUSA_PORT:-9000}"
NEXTJS_PORT="${NEXTJS_PORT:-3000}"
DB_PORT="${DB_PORT:-5433}"
MEDUSA_DB_PORT="${MEDUSA_DB_PORT:-5435}"
REDIS_PORT="${MEDUSA_REDIS_PORT:-6380}"

# Parse arguments
SKIP_MEDUSA=false
STOP_ALL=false
for arg in "$@"; do
    case $arg in
        --no-medusa)
            SKIP_MEDUSA=true
            shift
            ;;
        --stop)
            STOP_ALL=true
            shift
            ;;
        *)
            ;;
    esac
done

# Function to print status
print_status() {
    echo -e "${BLUE}[RevampIT]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local name="$1"
    local host="$2"
    local port="$3"
    local max_attempts="${4:-30}"
    local attempt=1

    print_status "Waiting for $name on port $port..."

    while [ $attempt -le $max_attempts ]; do
        if nc -z "$host" "$port" 2>/dev/null; then
            print_success "$name is ready"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done

    print_error "$name failed to start within ${max_attempts}s"
    return 1
}

# Function to wait for HTTP endpoint
wait_for_http() {
    local name="$1"
    local url="$2"
    local max_attempts="${3:-60}"
    local attempt=1

    print_status "Waiting for $name HTTP endpoint..."

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url" >/dev/null 2>&1; then
            print_success "$name HTTP endpoint is ready"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done

    print_warning "$name HTTP endpoint not responding (continuing anyway)"
    return 0
}

# Function to stop all services
stop_all_services() {
    print_status "Stopping all services..."

    # Kill Next.js
    pkill -f "next dev" 2>/dev/null || true

    # Kill Medusa
    pkill -f "medusa develop" 2>/dev/null || true

    # Stop Docker containers
    cd "$PROJECT_DIR"
    docker compose down 2>/dev/null || true

    print_success "All services stopped"
}

# Handle stop command
if [ "$STOP_ALL" = true ]; then
    stop_all_services
    exit 0
fi

# =============================================================================
# MAIN STARTUP SEQUENCE
# =============================================================================

cd "$PROJECT_DIR"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    RevampIT Startup                           ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# -----------------------------------------------------------------------------
# Step 1: Start Docker Infrastructure
# -----------------------------------------------------------------------------
print_status "Step 1: Starting Docker infrastructure..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Start all required containers
docker compose up -d db medusa_db medusa_redis meilisearch

# Wait for databases to be healthy
wait_for_service "PostgreSQL (main)" "localhost" "$DB_PORT" 30
wait_for_service "PostgreSQL (Medusa)" "localhost" "$MEDUSA_DB_PORT" 30
wait_for_service "Redis" "localhost" "$REDIS_PORT" 15
wait_for_service "Meilisearch" "localhost" 7700 15

print_success "Docker infrastructure is ready"
echo ""

# -----------------------------------------------------------------------------
# Step 2: Start Medusa Backend (if not skipped)
# -----------------------------------------------------------------------------
if [ "$SKIP_MEDUSA" = false ]; then
    print_status "Step 2: Starting Medusa backend..."

    if port_in_use "$MEDUSA_PORT"; then
        print_warning "Medusa already running on port $MEDUSA_PORT"
    else
        # Start Medusa in background
        cd "$PROJECT_DIR/medusa-backend"

        # Check if node_modules exists
        if [ ! -d "node_modules" ]; then
            print_status "Installing Medusa dependencies..."
            npm install
        fi

        # Start Medusa backend
        nohup npm run dev > "$PROJECT_DIR/logs/medusa.log" 2>&1 &
        MEDUSA_PID=$!
        echo $MEDUSA_PID > "$PROJECT_DIR/.medusa.pid"

        # Wait for Medusa to be ready
        wait_for_service "Medusa backend" "localhost" "$MEDUSA_PORT" 60
        wait_for_http "Medusa API" "http://localhost:${MEDUSA_PORT}/health" 30
    fi

    print_success "Medusa backend is ready"
    echo ""
else
    print_warning "Skipping Medusa backend (--no-medusa flag)"
    echo ""
fi

# -----------------------------------------------------------------------------
# Step 3: Start Next.js Frontend
# -----------------------------------------------------------------------------
print_status "Step 3: Starting Next.js frontend..."

cd "$PROJECT_DIR"

if port_in_use "$NEXTJS_PORT"; then
    print_warning "Next.js already running on port $NEXTJS_PORT"
else
    # Create logs directory if it doesn't exist
    mkdir -p "$PROJECT_DIR/logs"

    # Start Next.js
    print_status "Starting Next.js on port $NEXTJS_PORT..."
    WATCHPACK_POLLING=1 npm run dev &
    NEXTJS_PID=$!
    echo $NEXTJS_PID > "$PROJECT_DIR/.nextjs.pid"

    # Wait for Next.js to be ready
    wait_for_service "Next.js" "localhost" "$NEXTJS_PORT" 30
fi

# =============================================================================
# STARTUP COMPLETE
# =============================================================================

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                 All Services Running!                         ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}Frontend:${NC}      http://localhost:${NEXTJS_PORT}"
echo -e "  ${BLUE}Admin:${NC}         http://localhost:${NEXTJS_PORT}/admin"
if [ "$SKIP_MEDUSA" = false ]; then
echo -e "  ${BLUE}Medusa Admin:${NC}  http://localhost:${MEDUSA_PORT}/app"
echo -e "  ${BLUE}Medusa API:${NC}    http://localhost:${MEDUSA_PORT}/store"
fi
echo -e "  ${BLUE}Meilisearch:${NC}   http://localhost:7700"
echo ""
echo -e "  ${YELLOW}To stop all services:${NC} npm run stop:all"
echo ""

# Keep the script running to show Next.js output
wait
