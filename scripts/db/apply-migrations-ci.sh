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
# 005_messaging_system.sql duplicates 005c_messaging_system.sql (same triggers/tables).
# Fresh CI DB applies 005c first (sort -V); re-running 005_messaging fails on triggers.
SKIP_FILES=("005_messaging_system.sql")

for f in $(ls scripts/db/migrations/*.sql | sort -V); do
  base=$(basename "$f")
  skip=0
  for s in "${SKIP_FILES[@]}"; do
    if [ "$base" = "$s" ]; then skip=1; break; fi
  done
  if [ "$skip" -eq 1 ]; then
    echo "↷ skip $(basename "$f") (superseded duplicate)"
    continue
  fi
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
