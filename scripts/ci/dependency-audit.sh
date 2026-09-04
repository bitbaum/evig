#!/usr/bin/env bash
#
# Dependency advisory check.
#
# WHY THIS EXISTS
# ---------------
# 2026-08-06: three CRITICAL auth advisories (next-auth / @auth/core) sat open
# on `main` against a live site and nothing in CI was red. They were noticed
# only because `git push` happened to print GitHub's "found 10 vulnerabilities"
# banner. Nothing else surfaced them.
#
# The important part: advisories appear with NO code change. A check that only
# runs on push/PR cannot catch them — the tree that was green yesterday is
# vulnerable today because someone else published a GHSA. Hence two callers:
#
#   * ci.yml's `security` job — blocks a PR that INTRODUCES a critical.
#   * security-audit.yml (scheduled) — catches advisories published against
#     code that already merged, and files an issue.
#
# WHY CRITICAL BLOCKS BUT HIGH ONLY REPORTS
# -----------------------------------------
# A third party publishing an advisory must not be able to halt all shipping:
# auto-merge refuses to merge onto a red base, so failing CI on every new
# advisory would jam the entire merge train on someone else's release schedule.
# Criticals are rare and genuinely urgent, so they block. Everything else is
# reported loudly and, on the scheduled run, filed as an issue.
#
# Inputs (env):
#   FAIL_ON       critical | high | none   (default: critical)
#   ALERT_ISSUE   1 = file/close a tracking issue for high+ (needs REPO, GH_TOKEN)
#   REPO          owner/name (only when ALERT_ISSUE=1)

set -euo pipefail

FAIL_ON="${FAIL_ON:-critical}"
ALERT_ISSUE="${ALERT_ISSUE:-0}"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
report="$tmp/audit.json"

# --prod: a dev-only advisory cannot be reached by the running site, and
# treating it as production risk is how a gate earns a reputation for crying
# wolf and gets switched off. pnpm audit exits non-zero when it FINDS things, so
# its status is not an error signal here — the parsed counts are.
pnpm audit --prod --json > "$report" 2>/dev/null || true

if [ ! -s "$report" ]; then
  echo "::error::pnpm audit produced no output — treating as a failure rather than a pass"
  exit 1
fi

counts=$(python3 - "$report" <<'PY' || true
import json, sys
try:
    with open(sys.argv[1]) as fh:
        v = json.load(fh)["metadata"]["vulnerabilities"]
except Exception:
    raise SystemExit(1)
print(v.get("critical", 0), v.get("high", 0), v.get("moderate", 0), v.get("low", 0))
PY
)

if [ -z "$counts" ]; then
  echo "::error::could not parse pnpm audit output — treating as a failure rather than a pass"
  exit 1
fi

read -r crit high mod low <<EOF
$counts
EOF

echo "runtime advisories — critical:$crit high:$high moderate:$mod low:$low"

# Rendered once, reused by the log and the issue body.
detail=$(python3 - "$report" <<'PY'
import json, sys

with open(sys.argv[1]) as fh:
    data = json.load(fh)

# npm audit v2 shape: top-level "vulnerabilities" keyed by package name.
for name, v in sorted(data.get("vulnerabilities", {}).items()):
    if v.get("severity") not in ("critical", "high"):
        continue
    titles = [x.get("title", "") for x in v.get("via", []) if isinstance(x, dict)]
    title = titles[0][:110] if titles else ""
    fix = v.get("fixAvailable")
    if fix is True:
        fix = "yes"
    elif isinstance(fix, dict):
        fix = "{}@{}".format(fix.get("name"), fix.get("version"))
    else:
        fix = "no"
    print("- **{}** `{}` — {} (fix available: {})".format(v["severity"], name, title, fix))

# pnpm audit emits the older v1 shape: top-level "advisories" keyed by id.
for _id, a in sorted(data.get("advisories", {}).items()):
    if a.get("severity") not in ("critical", "high"):
        continue
    title = (a.get("title") or "")[:110]
    patched = a.get("patched_versions") or "none"
    print("- **{}** `{}` — {} (patched: {})".format(a["severity"], a.get("module_name"), title, patched))
PY
)

if [ -n "$detail" ]; then
  echo "--- critical/high detail ---"
  printf '%s\n' "$detail"
fi

if [ "$ALERT_ISSUE" = "1" ]; then
  : "${REPO:?REPO is required when ALERT_ISSUE=1}"
  TITLE="🔐 dependency advisories open on main"
  existing=$(gh issue list -R "$REPO" --state open --search "$TITLE in:title" \
    --json number --jq '.[0].number // empty')

  if [ "$((crit + high))" -gt 0 ]; then
    BODY=$(printf '%s\n' \
      "\`pnpm audit --prod\` on \`main\`: **critical:$crit high:$high** (moderate:$mod low:$low)." \
      "" \
      "$detail" \
      "" \
      "Advisories appear without any code change, so this is found on a schedule rather than on push." \
      "" \
      "Check for a **nested** copy before assuming a bump fixed it — a patched hoisted version can sit alongside a vulnerable one pinned by a dependency (\`npm ls <pkg>\`). That is how a critical survived the bump that was supposed to fix it on 2026-08-06." \
      "" \
      "This issue closes itself when critical and high both reach zero.")
    if [ -n "$existing" ]; then
      gh issue comment "$existing" -R "$REPO" --body "$BODY"
    else
      gh issue create -R "$REPO" --title "$TITLE" --body "$BODY"
    fi
  elif [ -n "$existing" ]; then
    gh issue close "$existing" -R "$REPO" \
      --comment "No critical or high runtime advisories remain (moderate:$mod low:$low)."
  fi
fi

case "$FAIL_ON" in
  critical) blocking=$crit ;;
  high)     blocking=$((crit + high)) ;;
  none)     blocking=0 ;;
  *) echo "::error::unknown FAIL_ON '$FAIL_ON' (expected critical|high|none)"; exit 1 ;;
esac

if [ "$blocking" -gt 0 ]; then
  echo "::error::dependency audit failed — $FAIL_ON-level advisories present"
  exit 1
fi

echo "no $FAIL_ON-level runtime advisories"
