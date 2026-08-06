#!/usr/bin/env bash
#
# File (or resolve) the single "main is red" issue.
#
# WHY THIS IS A SCRIPT AND NOT INLINE YAML
# ----------------------------------------
# Two different workflows have to reach this same verdict:
#   * main-red-alert.yml, from the `workflow_run` event, when CI ran on a push;
#   * ci.yml's post-main job, when CI was dispatched by the auto-merge sweep and
#     GitHub therefore emits no `workflow_run` event at all.
#
# The second path is the COMMON one here: every merge is an auto-merge, made
# with GITHUB_TOKEN, which fires no push event — so the sweep re-arms ci.yml by
# dispatch, and a dispatched run cascades nothing. A workflow_run-only alarm is
# silent on exactly the path that produces almost every main CI run in this repo.
# (Observed 2026-08-06: main went red on a66baa55 and no issue was filed.)
#
# One policy, one file. Duplicating it in YAML is how the two paths would drift.
#
# Inputs (env):
#   REPO        owner/name
#   CONCLUSION  success | failure | cancelled | ...
#   RUN_SHA     commit the run was for
#   RUN_URL     link to the run

set -euo pipefail

: "${REPO:?REPO is required}"
: "${CONCLUSION:?CONCLUSION is required}"
RUN_SHA="${RUN_SHA:-unknown}"
RUN_URL="${RUN_URL:-}"

TITLE="🔴 main is red — CI failing on main"

existing=$(gh issue list -R "$REPO" --state open --search "$TITLE in:title" \
  --json number --jq '.[0].number // empty')

# A cancelled run means a newer push superseded this one (the CI concurrency
# group cancels in-progress runs). That is not a failure, and treating it as one
# is how "cancelled" gets misread as "broken".
if [ "$CONCLUSION" != "failure" ]; then
  if [ "$CONCLUSION" = "success" ] && [ -n "$existing" ]; then
    gh issue close "$existing" -R "$REPO" \
      --comment "main is green again as of ${RUN_SHA:0:8} — $RUN_URL"
  fi
  exit 0
fi

BODY=$(printf '%s\n' \
  "CI failed on \`main\` at commit \`${RUN_SHA:0:8}\`." \
  "" \
  "Run: $RUN_URL" \
  "" \
  "**Every PR branched from this commit inherits the failure**, and auto-merge refuses to merge onto a broken base — so nothing ships until this is green." \
  "" \
  "Fix or revert, then re-run **main's** run (\`gh run rerun <run-id> --failed\`). Re-running your own branch does not clear this." \
  "" \
  "This issue closes itself when a CI run on main succeeds.")

if [ -n "$existing" ]; then
  gh issue comment "$existing" -R "$REPO" --body "$BODY"
else
  gh issue create -R "$REPO" --title "$TITLE" --body "$BODY"
fi
