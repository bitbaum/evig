#!/usr/bin/env bash
#
# Merge every open PR that is ready and fully green, then re-arm CI/CD.
#
# WHY THIS EXISTS
# ---------------
# Nobody reviews PRs on this fleet — the owner explicitly does not want to be in
# the merge loop, and background-job agent sessions are barred from merging by
# hand. So the policy lives here, in the repo, where it is visible, revocable,
# and applies uniformly to every PR instead of depending on who opened it.
#
# THE POLICY
#   merge a PR  <=>  it is not a draft
#                    AND carries no hold label
#                    AND has at least one check
#                    AND every check has finished green
#                    AND GitHub reports it cleanly mergeable
#
# Anything else is left alone for the next sweep. Nothing here forces a merge:
# a red or pending PR simply waits, and a draft waits forever. To hold a ready
# PR back, mark it a draft or add one of the hold labels below.
#
# ONE PR PER SWEEP, OLDEST FIRST, AND ONLY ONTO A GREEN BASE
# ----------------------------------------------------------
# A PR's checks prove *that PR against the base it branched from* — not against
# the other PRs sitting next to it. Merging a batch in one pass would put a
# combination onto the base that nothing ever built. So this script merges at
# most one PR, then hands control back to CI: the merge train advances one car
# per sweep, and every car is verified on the base before the next one couples.
#
# For the same reason it refuses to merge while the base's CI is red or still
# running. Red base => stop adding changes until it is fixed; running CI => the
# answer is not in yet. Both simply defer to the next sweep.
#
# THE RE-ARM (do not remove)
#   A push made with the default GITHUB_TOKEN does NOT trigger workflows. Both
#   CI and the deploy workflow here run on push, so a merge from this script
#   would otherwise land on the base branch and never build or ship. Worse, the
#   green-base guard above keys on "a CI run exists for the current tip" — with
#   no CI run ever produced by an automated merge, the very next sweep would
#   block forever. The explicit workflow_dispatch calls at the end restore both.
#
#   REARM_WORKFLOWS is set by .github/workflows/auto-merge.yml and lists exactly
#   the workflows that would otherwise have fired on push.

set -euo pipefail

REPO="${GH_REPO:?GH_REPO must be set}"
BASE_BRANCH="${BASE_BRANCH:-main}"
CI_WORKFLOW="${CI_WORKFLOW:-ci.yml}"
REARM_WORKFLOWS="${REARM_WORKFLOWS:-$CI_WORKFLOW}"

# A PR wearing any of these is never merged automatically.
HOLD_LABELS='["hold","no-automerge","do-not-merge","wip"]'

# How many attempts a single run may reach before this stops retrying it. A
# GitHub incident can last hours; without a cap the sweep would re-run the same
# doomed run every 10 minutes indefinitely and bury the real signal.
MAX_RUN_ATTEMPTS="${MAX_RUN_ATTEMPTS:-3}"

# Did this run fail WITHOUT executing any of our own steps?
#
# A job whose only failed step is "Set up job" never ran a line of this repo's
# code — GitHub could not resolve an action, provision the runner, or start the
# container. That is not a verdict about the code; it is the same shape of noise
# as a cancellation. But it lands as conclusion=failure, and the retry policy
# below deliberately leaves genuine failures alone — so during a GitHub Actions
# incident EVERY open PR is stranded permanently, with no human in the loop to
# notice.
#
# Observed 2026-08-06 (Actions major outage, webhooks throttled to ~15%):
# "Failed to resolve action download info. Error: Service Unavailable" failed
# three jobs on PR #278; the job's step list was exactly [Set up job: failure].
#
# Conservative by construction: it re-runs only when EVERY failed job across the
# run failed at set-up. One real step failure anywhere and this returns false.
run_failure_is_infra() {
  run_failure_is_infra_id="$1"
  run_failure_is_infra_steps=$(gh api \
    "repos/${REPO}/actions/runs/${run_failure_is_infra_id}/jobs" --paginate \
    --jq '[ .jobs[]
            | select(.conclusion == "failure")
            | [ .steps[]? | select(.conclusion == "failure") | .name ] ]
          | flatten | unique | join("|")' 2>/dev/null) || return 1

  # Empty means no failed job was visible, or the API did not answer. Either way
  # we do not know, and guessing "infra" here would re-run real failures forever.
  [ -n "$run_failure_is_infra_steps" ] || return 1
  [ "$run_failure_is_infra_steps" = "Set up job" ]
}

# Is this conclusion a statement ABOUT THE CODE, or just noise?
#
# `cancelled` never is (concurrency:cancel-in-progress, or an incident killing
# the run mid-flight). `failure` usually is — unless nothing of ours ever ran.
run_conclusion_is_non_verdict() {
  case "$1" in
    cancelled) return 0 ;;
    failure) run_failure_is_infra "$2" ;;
    *) return 1 ;;
  esac
}

# Re-run a run that produced no verdict, capped by its own attempt counter.
#
# `gh run rerun` (rather than a fresh `workflow run` dispatch) is deliberate:
# re-running increments run_attempt, so the attempt counter IS the loop cap. A
# fresh dispatch would start every retry back at attempt 1 and could churn
# forever. Prints why it declined, so the sweep log always explains itself.
rerun_non_verdict_run() {
  rerun_id="$1"
  rerun_what="$2"

  rerun_attempt=$(gh api "repos/${REPO}/actions/runs/${rerun_id}" \
    --jq '.run_attempt // 1' 2>/dev/null || echo "$MAX_RUN_ATTEMPTS")
  if [ "$rerun_attempt" -ge "$MAX_RUN_ATTEMPTS" ]; then
    echo "[auto-merge] ${rerun_what} run ${rerun_id} already at attempt ${rerun_attempt}/${MAX_RUN_ATTEMPTS} — not retrying again" >&2
    return 1
  fi

  echo "[auto-merge] ${rerun_what} run ${rerun_id} produced no verdict (attempt ${rerun_attempt}) — re-running"
  gh run rerun "$rerun_id" --repo "$REPO" \
    || { echo "[auto-merge] could not re-run ${rerun_id}" >&2; return 1; }
}

echo "[auto-merge] sweeping open PRs against ${BASE_BRANCH} in ${REPO}"

# Never add changes to a base that is red or mid-verification.
#
# The run has to belong to the CURRENT tip of the base branch. Checking only
# "the latest CI run" is a trap: right after a merge, the newest run is still
# the *previous* commit's — and it is green — so the guard would wave through a
# second merge onto a commit nothing has verified yet. That is exactly the
# batching this script exists to prevent.
base_sha=$(gh api "repos/${REPO}/commits/${BASE_BRANCH}" --jq '.sha')
base_ci=$(gh run list --repo "$REPO" --workflow "$CI_WORKFLOW" --branch "$BASE_BRANCH" --limit 1 \
  --json status,conclusion,headSha,databaseId --jq '.[0] // empty')

if [ -z "$base_ci" ]; then
  echo "[auto-merge] no CI history for ${BASE_BRANCH} — proceeding"
else
  base_status=$(printf '%s' "$base_ci" | jq -r '.status')
  base_conclusion=$(printf '%s' "$base_ci" | jq -r '.conclusion // ""')
  base_ci_sha=$(printf '%s' "$base_ci" | jq -r '.headSha')
  base_run_id=$(printf '%s' "$base_ci" | jq -r '.databaseId')

  if [ "$base_ci_sha" != "$base_sha" ]; then
    echo "[auto-merge] ${BASE_BRANCH} is at ${base_sha:0:8} but the newest CI run is for ${base_ci_sha:0:8} — waiting for CI to catch up"
    exit 0
  fi
  if [ "$base_status" != "completed" ]; then
    echo "[auto-merge] ${BASE_BRANCH} CI is still running — deferring to the next sweep"
    exit 0
  fi
  if [ "$base_conclusion" != "success" ]; then
    # THE DEADLOCK. The only thing that produces a new CI run on the base is a
    # merge, and merges are exactly what this guard blocks — so a base run that
    # ended without a verdict strands every open PR until a human notices, and
    # nothing signals that they should. The sweep still exits 0, so from the
    # outside the automation looks perfectly healthy while merging nothing.
    #
    # Observed in this repo 2026-08-07: an Actions incident left main's run
    # `failure` with no failed job at all (one cancelled, rest green). It held
    # 11 PRs for ~14h. The retry below is the same reasoning already applied to
    # PR checks further down — this is the sibling path that was left open.
    #
    # A genuine failure still blocks: that IS a verdict about the code.
    if run_conclusion_is_non_verdict "$base_conclusion" "$base_run_id"; then
      rerun_non_verdict_run "$base_run_id" "${BASE_BRANCH}" || true
      echo "[auto-merge] deferring to the next sweep to judge ${BASE_BRANCH}"
      exit 0
    fi
    echo "[auto-merge] ${BASE_BRANCH} CI is ${base_conclusion} — refusing to merge onto a broken base" >&2
    exit 0
  fi
fi

prs_json=$(gh pr list --repo "$REPO" --state open --base "$BASE_BRANCH" --limit 50 \
  --json number,title,isDraft,mergeable,mergeStateStatus,labels,statusCheckRollup)

count=$(printf '%s' "$prs_json" | jq 'length')
if [ "$count" -eq 0 ]; then
  echo "[auto-merge] no open PRs"
  exit 0
fi

merged_any=0

# OLDEST FIRST. `gh pr list` returns newest-first, and this loop merges the
# first eligible PR and stops — so the newest green PR wins every sweep and an
# older one can wait indefinitely. Observed in maonakamoto/fleetcrown on
# 2026-08-06: two consecutive sweeps merged the two newest PRs while three
# older green ones were never even evaluated. With several agent sessions
# opening PRs continuously, "newest wins" is starvation, and it starves the PR
# whose checks were proven against the most now-stale base.
#
# PR numbers increase monotonically with creation, so sorting ascending is FIFO.
for number in $(printf '%s' "$prs_json" | jq -r 'sort_by(.number) | .[].number'); do
  pr=$(printf '%s' "$prs_json" | jq -c --argjson n "$number" '.[] | select(.number == $n)')
  title=$(printf '%s' "$pr" | jq -r '.title')

  # A rollup entry is either a CheckRun (status + conclusion) or a commit
  # StatusContext (state) — external services report as the latter.
  verdict=$(printf '%s' "$pr" | jq -r --argjson hold "$HOLD_LABELS" '
    def ok:
      if has("state") then (.state == "SUCCESS")
      else ((.status == "COMPLETED")
            and ((.conclusion // "") | test("^(SUCCESS|NEUTRAL|SKIPPED)$"))) end;
    def pending:
      if has("state") then (.state == "PENDING")
      else (.status != "COMPLETED") end;

    . as $pr
    | (($pr.statusCheckRollup) // []) as $checks
    | if $pr.isDraft then "skip: draft"
      elif ([$pr.labels[]?.name] | any(. as $l | $hold | index($l) != null))
        then "skip: hold label"
      elif ($checks | length) == 0 then "skip: no checks reported yet"
      elif ($checks | map(pending) | any) then "skip: checks still running"
      elif (($checks | map(ok) | all) | not) then "skip: checks not green"
      else "merge" end
  ')

  if [ "$verdict" != "merge" ]; then
    echo "[auto-merge] #${number} ${verdict} — ${title}"

    # Two kinds of non-verdict are retried; a genuine failure is never touched.
    #
    # CANCELLED: CI workflows here use `concurrency: cancel-in-progress`, so an
    # unrelated newer run on the same ref can kill a PR's build. Nothing else
    # re-runs it, so the PR would sit in this queue forever.
    #
    # SET-UP-ONLY FAILURE: the run never executed a step of ours (see
    # run_failure_is_infra). It lands as conclusion=failure but says nothing
    # about the code.
    #
    # Both are re-run so a later sweep can judge the real result.
    if [ "$verdict" = "skip: checks not green" ]; then
      cancelled_urls=$(printf '%s' "$pr" | jq -r '
        .statusCheckRollup[]?
        | select(has("state") | not)
        | select((.conclusion // "") == "CANCELLED")
        | .detailsUrl
      ')
      failed_urls=$(printf '%s' "$pr" | jq -r '
        .statusCheckRollup[]?
        | select(has("state") | not)
        | select(((.conclusion // "")
                  | test("^(FAILURE|TIMED_OUT|ACTION_REQUIRED|STARTUP_FAILURE|ERROR)$")))
        | .detailsUrl
      ')

      retry_urls=""
      if [ -z "$failed_urls" ]; then
        retry_urls="$cancelled_urls"
      else
        # Retry a failing PR ONLY if every failed run never reached our code.
        all_infra=1
        for url in $failed_urls; do
          run_id=$(printf '%s' "$url" | grep -oE '/runs/[0-9]+' | grep -oE '[0-9]+' || true)
          if [ -z "$run_id" ] || ! run_failure_is_infra "$run_id"; then
            all_infra=0
            break
          fi
        done
        if [ "$all_infra" = "1" ]; then
          echo "[auto-merge] #${number} failures never reached our code (set-up only) — treating as infrastructure"
          retry_urls=$(printf '%s\n%s' "$failed_urls" "$cancelled_urls")
        fi
      fi

      # Whole run, never `--failed`. A partial re-run re-runs the failed jobs
      # but flips everything that was SKIPPED to CANCELLED, so the PR ends up
      # non-green for a NEW reason and needs yet another retry. Observed on
      # #278 on 2026-08-07. Re-running everything costs more minutes and is
      # the only way to get one coherent verdict.
      for url in $retry_urls; do
        run_id=$(printf '%s' "$url" | grep -oE '/runs/[0-9]+' | grep -oE '[0-9]+' || true)
        [ -z "$run_id" ] && continue
        rerun_non_verdict_run "$run_id" "#${number}" || true
      done
    fi
    continue
  fi

  # Mergeability is computed lazily by GitHub and is invalidated every time the
  # base branch moves — so right after a merge (exactly when this workflow runs)
  # every PR reports UNKNOWN. Poll until GitHub has an answer instead of
  # treating "not computed yet" as "not mergeable"; otherwise the fast path can
  # never merge anything and the whole train falls back to the cron.
  mergeable=""
  state=""
  for attempt in 1 2 3 4 5 6; do
    fresh=$(gh pr view "$number" --repo "$REPO" --json mergeable,mergeStateStatus)
    mergeable=$(printf '%s' "$fresh" | jq -r '.mergeable')
    state=$(printf '%s' "$fresh" | jq -r '.mergeStateStatus')
    [ "$mergeable" != "UNKNOWN" ] && break
    echo "[auto-merge] #${number} mergeability not computed yet (attempt ${attempt}) — waiting"
    sleep 5
  done

  if [ "$mergeable" != "MERGEABLE" ]; then
    echo "[auto-merge] #${number} skip: not mergeable (${mergeable}/${state}) — ${title}"
    continue
  fi

  echo "[auto-merge] #${number} green and ready — merging: ${title}"
  if gh pr merge "$number" --repo "$REPO" --squash --delete-branch; then
    merged_any=1
    echo "[auto-merge] #${number} merged"
    # One car per sweep: let CI verify this on the base before the next couples.
    break
  else
    # Losing a race (someone merged first, or the base moved underneath) is
    # normal; the next sweep re-evaluates from fresh state.
    echo "[auto-merge] #${number} merge failed — leaving for the next sweep" >&2
  fi
done

if [ "$merged_any" -eq 1 ]; then
  for wf in $REARM_WORKFLOWS; do
    echo "[auto-merge] re-arming ${wf} on ${BASE_BRANCH}"
    gh workflow run "$wf" --repo "$REPO" --ref "$BASE_BRANCH" \
      || echo "[auto-merge] could not dispatch ${wf} — is workflow_dispatch declared?" >&2
  done
else
  echo "[auto-merge] nothing merged; no re-arm needed"
fi
