#!/usr/bin/env bash
# Hand-rolled card shells (`bg-surface-base rounded-lg/xl border`) are chrome
# drift: the SSOT is <Card>/<Panel> (see CLAUDE.md "Chrome & Navigation").
# 120 sites existed when this ratchet was added — too many to sweep in one PR,
# so the count may FALL or HOLD but never RISE. New surfaces must use the
# primitives; reductions should lower the baseline in the same PR.
#
# Deliberately no `set -e`: this gate reads state and must fail only on its
# own verdict, never die mid-question with no output.

BASELINE_FILE="$(dirname "$0")/card-shell-baseline.txt"

baseline=$(cat "$BASELINE_FILE" 2>/dev/null)
if ! [ "$baseline" -ge 0 ] 2>/dev/null; then
  echo "card-shell-ratchet: baseline unreadable at $BASELINE_FILE" >&2
  exit 1
fi

# Exclude comment lines (leading `*`) so documenting the anti-pattern is free.
count=$(grep -rE 'bg-surface-base rounded-(lg|xl) border' src/components src/app 2>/dev/null \
  | grep -cvE ':[0-9]+:\s*\*')

echo "card-shell-ratchet: $count hand-rolled card shells (baseline $baseline)"

if [ "$count" -gt "$baseline" ]; then
  echo "card-shell-ratchet: FAIL — count rose above baseline." >&2
  echo "Use <Card>/<Panel> (components/ui) instead of a hand-rolled shell." >&2
  echo "New offenders:" >&2
  grep -rnE 'bg-surface-base rounded-(lg|xl) border' src/components src/app | grep -vE ':[0-9]+:\s*\*' | tail -5 >&2
  exit 1
fi

if [ "$count" -lt "$baseline" ]; then
  echo "card-shell-ratchet: count fell — lower the baseline to $count in $BASELINE_FILE (same PR)."
fi
exit 0
