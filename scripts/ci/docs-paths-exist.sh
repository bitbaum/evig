#!/usr/bin/env bash
# Every repo path named in the docs must exist.
#
# The docs had drifted into describing a codebase that moved on: a whole
# "Layer 2 — tailwind.config.ts" section for a file Tailwind v4 removed,
# `src/lib/design/design-system.ts` (it is `src/lib/design-system.ts`),
# `002-simplified-auth.sql` (it is `002b-`), `repairer_profiles` (renamed to
# `technician_profiles` by migration 105). Each one sends the next reader — or
# the next agent session — somewhere that does not exist, and the design-system
# section was confidently wrong about the token names too.
#
# A path in backticks is a checkable claim, so check it. Prose is left alone.
#
# No `set -e`: this script decides its own verdict and must report ALL misses,
# not die on the first grep that finds nothing.
set -uo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)" || exit 1

# The LIVING docs — the ones a reader is meant to act on today.
#
# Deliberately excluded: docs/development, docs/archive, docs/projects and the
# AUDIT_*/PLAN-style files. Those are point-in-time records (a plan written in
# June describing files that later moved is not wrong, it is history), and
# gating them would force rewriting the past to keep CI green.
DOCS=(CLAUDE.md .claude/CLAUDE.md README.md)
while IFS= read -r f; do
  case "$f" in
    *AUDIT*|*_PLAN.md|*PLAN_*.md) continue ;;
  esac
  DOCS+=("$f")
done < <(find docs -maxdepth 1 -name '*.md' 2>/dev/null)
for dir in docs/guides docs/operations docs/components docs/features; do
  [ -d "$dir" ] || continue
  while IFS= read -r f; do DOCS+=("$f"); done < <(find "$dir" -name '*.md' 2>/dev/null)
done

missing=0
primary_missing=0
checked=0

# The docs an agent session reads first. These are held at ZERO, not ratcheted:
# a wrong path here sends the next session to a file that does not exist.
is_primary() {
  case "$1" in
    CLAUDE.md|.claude/CLAUDE.md|README.md) return 0 ;;
    *) return 1 ;;
  esac
}

for doc in "${DOCS[@]}"; do
  [ -f "$doc" ] || continue
  # Backticked tokens that look like repo paths: contain a slash or a known
  # source extension, and no spaces, globs, URLs or shell/regex punctuation.
  while IFS= read -r path; do
    case "$path" in
      *' '*|*'*'*|*'$'*|*'|'*|*'('*|*'<'*|*http*|*'{'*|*'\'*) continue ;;
      */) continue ;;
    esac
    # Only paths that plausibly point into this repo.
    case "$path" in
      src/*|scripts/*|docs/*|messages/*|public/*|.github/*|packages/*|tests/*) ;;
      *) continue ;;
    esac
    checked=$((checked + 1))
    if [ ! -e "$path" ]; then
      echo "  ✗ $doc → $path"
      missing=$((missing + 1))
      is_primary "$doc" && primary_missing=$((primary_missing + 1))
    fi
  done < <(grep -oE '`[^`]+`' "$doc" 2>/dev/null | tr -d '`' | sort -u)
done

echo "docs-paths: checked $checked path references across ${#DOCS[@]} docs"

# A sweep that checks nothing passes trivially — say so loudly instead.
if [ "$checked" -lt 20 ]; then
  echo "docs-paths: FAIL — only $checked references found; the extractor is broken, not the docs"
  exit 1
fi

# Ratchet, like the card-shell gate: the three agent-facing docs (CLAUDE.md,
# .claude/CLAUDE.md, README.md) are at ZERO and must stay there; the long tail
# in older reference docs is pinned at a baseline that may fall or hold, never
# rise. Blocking on all of them today would have meant not shipping the gate.
BASELINE_FILE="scripts/ci/docs-paths-baseline.txt"
baseline=$(cat "$BASELINE_FILE" 2>/dev/null || echo 0)

echo "docs-paths: $missing stale reference(s) (baseline $baseline), $primary_missing in the primary docs (must be 0)"

if [ "$primary_missing" -gt 0 ]; then
  echo "docs-paths: FAIL — CLAUDE.md / .claude/CLAUDE.md / README.md name $primary_missing path(s) that do not exist."
  echo "  These are the first files an agent session reads; they are held at zero."
  exit 1
fi

if [ "$missing" -gt "$baseline" ]; then
  echo "docs-paths: FAIL — stale documented paths rose $baseline → $missing"
  echo "  Fix the doc (or restore the file). Stale docs teach the wrong thing."
  exit 1
fi

if [ "$missing" -lt "$baseline" ]; then
  echo "docs-paths: count fell — lower the baseline to $missing in $BASELINE_FILE (same PR)."
fi

echo "docs-paths: OK"
