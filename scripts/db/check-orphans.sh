#!/usr/bin/env bash
# check-orphans.sh — surface orphan FK references in the production DB.
#
# The schema has a few intentionally polymorphic columns (TEXT IDs that
# point at different tables based on a sibling type/discriminator).
# Postgres can't enforce FK on them, so referenced rows can be deleted
# while the polymorphic reference survives. This script reports the
# orphan count per polymorphic + per real-FK relationship.
#
# Reports counts only — never mutates. Pipe to `tee` if you want a
# point-in-time snapshot.
#
# Usage:
#   source .env.local && bash scripts/db/check-orphans.sh
#
# CI: schedule this monthly via a systemd timer on the box or a GitHub Actions schedule.
# If any orphan count crosses an action threshold (e.g. >100), file an
# issue; otherwise log + continue.

set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL not set — source .env.local first}"

run() {
  local label="$1"
  local sql="$2"
  local count
  count=$(psql "$DATABASE_URL" -tA -c "$sql" 2>/dev/null || echo "ERR")
  printf "  %-50s %s\n" "$label" "$count"
}

echo ""
echo "=== Real-FK orphans (should always be 0 — Postgres enforces) ==="
run "listings.seller_id -> users(id)" \
  "SELECT COUNT(*) FROM listings WHERE seller_id NOT IN (SELECT id FROM users)"
run "messages.sender_id -> users(id)" \
  "SELECT COUNT(*) FROM messages WHERE sender_id NOT IN (SELECT id FROM users)"
run "tasks.created_by -> users(id)" \
  "SELECT COUNT(*) FROM tasks WHERE created_by NOT IN (SELECT id FROM users)"
run "project_needs.project_id -> projects(id)" \
  "SELECT COUNT(*) FROM project_needs WHERE project_id NOT IN (SELECT id FROM projects)"

echo ""
echo "=== Polymorphic-reference orphans (Postgres can't enforce — manual sweep) ==="
echo ""
echo "  These columns store TEXT ids that reference different tables based on a"
echo "  sibling type/discriminator. Non-zero results = stale references survive"
echo "  after the referenced row was deleted."
echo ""

run "fundraising_activity_log orphans (not in fundraising_foundations)" \
  "SELECT COUNT(*) FROM fundraising_activity_log
     WHERE entity_id NOT IN (SELECT id::text FROM fundraising_foundations)"

run "notifications.related_id (not in listings/messages/decisions)" \
  "SELECT COUNT(*) FROM notifications n
     WHERE n.related_id IS NOT NULL
       AND n.related_id NOT IN (SELECT id::text FROM listings)
       AND n.related_id NOT IN (SELECT id::text FROM messages)
       AND n.related_id NOT IN (SELECT id::text FROM decisions)"

echo ""
echo "=== Stale account orphans ==="
run "verification_tokens for deleted users" \
  "SELECT COUNT(*) FROM verification_tokens
     WHERE identifier NOT IN (SELECT email FROM users)"
run "sessions for deleted users" \
  "SELECT COUNT(*) FROM sessions
     WHERE \"userId\" NOT IN (SELECT id FROM users)"

echo ""
echo "Done. Action thresholds:"
echo "  - Real-FK orphans > 0  = bug. File immediately."
echo "  - Polymorphic > 100    = run cleanup migration."
echo "  - Stale tokens/sessions > 1000 = add scheduled prune."
