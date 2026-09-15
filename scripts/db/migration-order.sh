#!/usr/bin/env bash
# SSOT for WHICH migrations run and in WHAT ORDER.
#
# Three runners apply migrations — the local runner (run-migration.sh), the CI
# from-zero replay (apply-migrations-ci.sh) and the production deploy
# (selfhost-deploy-evig.sh). They used to each decide ordering for
# themselves, and they disagreed:
#
#   run-migration.sh          sort -V, no skip list  → failed on a fresh DB
#   apply-migrations-ci.sh    sort -V + skip list    → green
#   selfhost-deploy           bare glob (lexicographic!) → a THIRD order
#
# A bare glob sorts `005_messaging` before `005b`/`005c`; `sort -V` does the
# reverse. So CI's from-zero replay never exercised the order production would
# actually use — the one path that matters during a disaster-recovery rebuild.
# Sourcing this file is now the only way to enumerate migrations.
#
# Usage:
#   source scripts/db/migration-order.sh
#   for f in $(migration_files); do ... done      # full paths, ordered
#
# Executed directly, it prints the ordered list (handy for diffing).
#
# Two files in the directory are deliberately EMPTY: 004_ai_inventory_system.sql
# and 005_messaging_system.sql were byte-identical re-adds of 004b/005c (the
# comment inside each has the history). Both names are recorded in production's
# schema_migrations, so the files stay; their bodies were removed 2026-09-14.
# Before that, 005 had to be skipped here — its unguarded CREATE TRIGGERs
# aborted a second application — which is why this file once carried a
# MIGRATION_SUPERSEDED list. An empty file applies as a no-op, so it does not.

# Repo root, resolved from this file so callers can run from anywhere.
MIGRATION_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATION_DIR="$MIGRATION_ROOT/scripts/db/migrations"

# Prints full paths, version-sorted.
migration_files() {
  ls "$MIGRATION_DIR"/*.sql | sort -V
}

# Direct execution → print the list.
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  migration_files
fi
