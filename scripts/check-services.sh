#!/bin/bash
# Service health check script for production deployment
# Run this before starting the application to ensure all services are ready

set -e

echo "🔍 Checking service health..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check HTTP service
check_http() {
    local url=$1
    local service_name=$2
    local max_attempts=${3:-5}
    local attempt=1

    echo -n "Checking $service_name... "

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s --max-time 10 "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Healthy${NC}"
            return 0
        fi

        echo -n "Attempt $attempt failed, retrying... "
        sleep 2
        ((attempt++))
    done

    echo -e "${RED}❌ Unhealthy${NC}"
    return 1
}

# Function to check database
check_database() {
    local host=$1
    local port=$2
    local user=$3
    local db=$4
    local service_name=$5

    echo -n "Checking $service_name... "

    if PGPASSWORD="$AUTH_DB_PASSWORD" psql -h "$host" -p "$port" -U "$user" -d "$db" -c "SELECT 1;" --quiet --no-align --tuples-only > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Connected${NC}"
        return 0
    else
        echo -e "${RED}❌ Connection failed${NC}"
        return 1
    fi
}

# Function to check Redis
check_redis() {
    local url=$1
    local service_name=$2

    echo -n "Checking $service_name... "

    if redis-cli -u "$url" ping | grep -q PONG; then
        echo -e "${GREEN}✅ Connected${NC}"
        return 0
    else
        echo -e "${RED}❌ Connection failed${NC}"
        return 1
    fi
}

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check services
all_healthy=true

# Check CMS database
if ! check_database "${AUTH_DB_HOST:-localhost}" "${AUTH_DB_PORT:-5433}" "${AUTH_DB_USER:-postgres}" "${AUTH_DB_NAME:-revampit_cms}" "CMS Database"; then
    all_healthy=false
fi

# Check Medusa database
if ! check_database "${MEDUSA_DB_HOST:-localhost}" "${MEDUSA_DB_PORT:-5435}" "${MEDUSA_DB_USER:-medusa}" "${MEDUSA_DB_NAME:-medusa_db}" "Medusa Database"; then
    all_healthy=false
fi

# Check Redis
if [ -n "$REDIS_URL" ]; then
    if ! check_redis "$REDIS_URL" "Redis"; then
        all_healthy=false
    fi
fi

# Check Medusa backend
if [ -n "$MEDUSA_BACKEND_URL" ]; then
    if ! check_http "${MEDUSA_BACKEND_URL}/health" "Medusa Backend" 3; then
        all_healthy=false
    fi
fi

# Check Meilisearch
if [ -n "$MEILI_MASTER_KEY" ]; then
    if ! check_http "http://localhost:${MEILI_PORT:-7700}/health" "Meilisearch" 3; then
        all_healthy=false
    fi
fi

# Summary
echo
if [ "$all_healthy" = true ]; then
    echo -e "${GREEN}🎉 All services are healthy!${NC}"
    exit 0
else
    echo -e "${RED}💥 Some services are unhealthy. Please check the output above.${NC}"
    exit 1
fi