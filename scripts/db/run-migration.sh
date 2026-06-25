#!/bin/bash
# ============================================================================
# RevampIT Database Migration Runner
#
# Applies every .sql file under scripts/db/migrations/ exactly once, tracked
# in the `schema_migrations` table (created by 075).
#
# Behavior:
#   - Files are applied in version-sorted order (`sort -V`), so 075 runs
#     after 074, 100 runs after 99, etc. Pre-075 hyphenated/underscored
#     names happen to sort the same way under -V as they did under plain
#     `sort`; the bootstrap in 075 records them all so re-runs skip them.
#   - Each file runs inside `BEGIN; ... COMMIT;` so a partial failure
#     rolls back cleanly.
#   - On success the filename is INSERTed into schema_migrations. On
#     re-invocation, already-recorded files are skipped.
#
# Targets the LOCAL development PostgreSQL (Docker on localhost:5433 by
# default). To apply migrations to production (Hetzner), run via psql against
# $DATABASE_URL on the box — schema_migrations tracks applied files there too.
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}RevampIT Database Migration${NC}"
echo -e "${GREEN}================================${NC}"

# Load .env if present
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

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

psql_exec() {
    PGPASSWORD="$DB_PASSWORD" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" "$@"
}

psql_query() {
    PGPASSWORD="$DB_PASSWORD" psql -At -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$1"
}

echo -e "${YELLOW}Checking database connection...${NC}"
if ! psql_exec -c '\q' 2>/dev/null; then
    echo -e "${RED}Error: Cannot connect to database${NC}"
    echo "Make sure PostgreSQL is running:  docker compose up -d db"
    exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Ensure the tracking table exists. The canonical CREATE TABLE lives in
# migration 075; this is a defensive bootstrap so the first run on a
# pre-075 database (or a fresh database where 075 itself hasn't been
# applied yet) doesn't fail when we query schema_migrations below.
psql_exec -c "CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());" >/dev/null

# Pull the set of already-applied filenames so we can skip them. Use a
# temp file so the shell loop can do an O(1) lookup per candidate file.
APPLIED_FILE=$(mktemp)
trap 'rm -f "$APPLIED_FILE"' EXIT
psql_query "SELECT filename FROM schema_migrations" > "$APPLIED_FILE"

is_applied() {
    grep -Fxq "$1" "$APPLIED_FILE"
}

echo -e "${YELLOW}Running migrations (version-sorted, skipping already-applied)...${NC}"
COUNT_APPLIED=0
COUNT_SKIPPED=0

for path in $(ls "$MIGRATIONS_DIR"/*.sql | sort -V); do
    name=$(basename "$path")
    if is_applied "$name"; then
        COUNT_SKIPPED=$((COUNT_SKIPPED + 1))
        continue
    fi

    echo -e "${YELLOW}→ $name${NC}"

    # Wrap each migration in BEGIN/COMMIT so a partial failure rolls back.
    # The INSERT into schema_migrations runs in the same transaction so a
    # crash mid-file doesn't leave the runner thinking the file applied.
    if PGPASSWORD="$DB_PASSWORD" psql -v ON_ERROR_STOP=1 \
        -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOSQL
BEGIN;
\i $path
INSERT INTO schema_migrations (filename) VALUES ('$name')
  ON CONFLICT (filename) DO NOTHING;
COMMIT;
EOSQL
    then
        COUNT_APPLIED=$((COUNT_APPLIED + 1))
    else
        echo -e "${RED}✗ $name failed — rolled back${NC}"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ Migration run complete${NC}"
echo -e "${GREEN}  applied: $COUNT_APPLIED · skipped (already applied): $COUNT_SKIPPED${NC}"
echo -e "${GREEN}================================${NC}"
