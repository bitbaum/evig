#!/usr/bin/env bash
# SSOT for WHICH migrations run and in WHAT ORDER.
#
# Three runners apply migrations — the local runner (run-migration.sh), the CI
# from-zero replay (apply-migrations-ci.sh) and the production deploy
# (selfhost-deploy-revampit.sh). They used to each decide ordering for
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

# Byte-identical duplicates of a later file (verified with md5sum). They stay on
# disk because applied migrations are protected — production has them recorded
# in schema_migrations, and deleting a recorded migration breaks replay. They
# are simply never re-applied: their objects are created by the surviving copy.
#   004_ai_inventory_system.sql == 004b_ai_inventory_system.sql
#   005_messaging_system.sql    == 005c_messaging_system.sql
# Only 005 needs skipping: its three CREATE TRIGGER statements are unguarded, so
# a second application aborts. 004's lone trigger is IF NOT EXISTS-guarded and
# is harmless either way — left in the list so this change alters no behavior
# CI has already verified.
MIGRATION_SUPERSEDED=("005_messaging_system.sql")

# Repo root, resolved from this file so callers can run from anywhere.
MIGRATION_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATION_DIR="$MIGRATION_ROOT/scripts/db/migrations"

# Prints full paths, version-sorted, superseded duplicates removed.
migration_files() {
  local path base skipped
  for path in $(ls "$MIGRATION_DIR"/*.sql | sort -V); do
    base="$(basename "$path")"
    skipped=0
    for s in "${MIGRATION_SUPERSEDED[@]}"; do
      [ "$base" = "$s" ] && { skipped=1; break; }
    done
    [ "$skipped" -eq 1 ] && continue
    printf '%s\n' "$path"
  done
}

# True when the given basename is a superseded duplicate (for callers that want
# to log the skip rather than silently drop it).
migration_is_superseded() {
  local s
  for s in "${MIGRATION_SUPERSEDED[@]}"; do
    [ "$1" = "$s" ] && return 0
  done
  return 1
}

# Direct execution → print the list.
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  migration_files
fi
