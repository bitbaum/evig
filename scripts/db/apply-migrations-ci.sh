#!/usr/bin/env bash
# Apply all SQL migrations in order — used by CI migration drift check.
# Requires PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

: "${PGHOST:?PGHOST required}"
: "${PGPORT:?PGPORT required}"
: "${PGUSER:?PGUSER required}"
: "${PGPASSWORD:?PGPASSWORD required}"
: "${PGDATABASE:?PGDATABASE required}"

echo "=== Migration drift check → ${PGUSER}@${PGHOST}:${PGPORT}/${PGDATABASE} ==="

psql -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;" || true

# Hirn RAG (005-hirn-ai-rag.sql) needs pgvector — skip gracefully only when unavailable
if psql -tAc "SELECT 1 FROM pg_available_extensions WHERE name = 'vector'" | grep -q 1; then
  psql -c "CREATE EXTENSION IF NOT EXISTS vector;"
else
  echo "WARN: pgvector extension not available — Hirn RAG migration will fail if present"
fi

count=0
# Ordering + the superseded-duplicate list are shared with the local runner and
# the production deploy — see scripts/db/migration-order.sh.
# shellcheck source=scripts/db/migration-order.sh
source "$ROOT/scripts/db/migration-order.sh"

for f in $(migration_files); do
  count=$((count + 1))
  echo "→ $(basename "$f")"
  psql -v ON_ERROR_STOP=1 -1 -f "$f" >/dev/null
done

echo ""
echo "✓ Applied $count migrations cleanly"
echo ""
echo "Final table count:"
psql -tA -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public'"
echo ""
if psql -tAc "SELECT to_regclass('public.schema_migrations') IS NOT NULL" | grep -q t; then
  echo "Tracking table state:"
  psql -tA -c "SELECT COUNT(*) || ' rows in schema_migrations' FROM schema_migrations"
fi
