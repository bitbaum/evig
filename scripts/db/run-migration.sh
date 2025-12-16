#!/bin/bash
# ============================================================================
# RevampIT Database Migration Runner
# Runs the unified auth migration against the main PostgreSQL database
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}RevampIT Database Migration${NC}"
echo -e "${GREEN}================================${NC}"

# Load environment variables if .env file exists
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Database configuration with defaults
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_NAME="${DB_NAME:-revampit_cms}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

MIGRATIONS_DIR="scripts/db/migrations"

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Migrations dir: $MIGRATIONS_DIR"
echo ""

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking database connection...${NC}"
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; then
    echo -e "${RED}Error: Cannot connect to database${NC}"
    echo "Make sure the PostgreSQL container is running:"
    echo "  docker compose up -d"
    exit 1
fi

echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Run migration
echo -e "${YELLOW}Running migrations (in order)...${NC}"

for file in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
  echo -e "${YELLOW}→ $file${NC}"
  PGPASSWORD=$DB_PASSWORD psql -v ON_ERROR_STOP=1 -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file"
done

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✓ Migration completed successfully!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo "Migrations run successfully."
    echo ""
else
    echo -e "${RED}Error: Migration failed${NC}"
    exit 1
fi







