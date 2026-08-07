/**
 * @jest-environment node
 *
 * Executes the REAL scripts/ci/auto-merge-sweep.sh against a fake `gh` on PATH.
 *
 * This tests shipped control flow rather than a description of it: a stubbed
 * re-implementation of the guard would have passed happily while the actual
 * script deadlocked, which is exactly what happened on 2026-08-07 (an Actions
 * incident left main `failure` with no failed job, and the sweep refused every
 * merge for ~14h while still exiting 0 and looking healthy).
 */
import { spawnSync } from 'child_process'
import { mkdtempSync, writeFileSync, readFileSync, chmodSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'

const SWEEP = resolve(__dirname, '../../../scripts/ci/auto-merge-sweep.sh')

interface Scenario {
  /** The base branch's newest CI run, as `gh run list --json ...` would report it. */
  baseCi: Record<string, unknown>
  /** Failed step names the jobs API reports for that run, `|`-joined (the script's jq shape). */
  failedSteps?: string
  /** run_attempt the runs API reports. */
  runAttempt?: number
}

interface SweepResult {
  /** stdout + stderr — the guard's refusal and the cap notice both go to stderr. */
  output: string
  ghCalls: string[]
  reruns: string[]
}

/**
 * Writes a fake `gh` that answers by argument shape and logs every invocation.
 * It returns values ALREADY filtered, because the script passes `--jq` and we
 * only care about what the script does with the answer.
 */
function runSweep(scenario: Scenario): SweepResult {
  const dir = mkdtempSync(join(tmpdir(), 'sweep-'))
  const log = join(dir, 'gh-calls.log')
  const gh = join(dir, 'gh')

  writeFileSync(
    gh,
    `#!/usr/bin/env bash
ARGS="$*"
echo "$ARGS" >> ${JSON.stringify(log)}
case "$ARGS" in
  *"/commits/main"*)        echo "basesha000000" ;;
  "run list"*)              cat <<'JSON'
${JSON.stringify(scenario.baseCi)}
JSON
                            ;;
  *"/jobs"*)                echo ${JSON.stringify(scenario.failedSteps ?? '')} ;;
  "run rerun"*)             echo "rerun dispatched" ;;
  "api repos/"*"/actions/runs/"*) echo ${JSON.stringify(String(scenario.runAttempt ?? 1))} ;;
  "pr list"*)               echo "[]" ;;
  "workflow run"*)          echo "dispatched" ;;
  *) echo "UNHANDLED gh call: $ARGS" >&2; exit 1 ;;
esac
`,
    { mode: 0o755 },
  )
  chmodSync(gh, 0o755)

  const proc = spawnSync('bash', [SWEEP], {
    env: {
      ...process.env,
      PATH: `${dir}:${process.env.PATH}`,
      GH_REPO: 'maonakamoto/evig',
      BASE_BRANCH: 'main',
    },
    encoding: 'utf8',
  })

  const output = `${proc.stdout ?? ''}${proc.stderr ?? ''}`

  // The sweep must always exit 0 — it is a scheduled janitor, not a gate. A
  // non-zero exit here means the fake gh hit an UNHANDLED call shape, which
  // would silently make every assertion below vacuous.
  expect({ status: proc.status, output }).toMatchObject({ status: 0 })

  const ghCalls = existsSync(log)
    ? readFileSync(log, 'utf8').split('\n').filter(Boolean)
    : []

  return { output, ghCalls, reruns: ghCalls.filter((c) => c.startsWith('run rerun')) }
}

/** The base run is at the branch tip and completed — only the conclusion varies. */
const baseCi = (conclusion: string) => ({
  status: 'completed',
  conclusion,
  headSha: 'basesha000000',
  databaseId: 31119402753,
})

describe('auto-merge sweep — base branch guard', () => {
  it('re-runs a CANCELLED base run instead of deadlocking behind it', () => {
    const { reruns, output } = runSweep({ baseCi: baseCi('cancelled') })

    // Nothing but a merge produces a new base CI run, and merges are what the
    // guard blocks — so without this the queue can never recover on its own.
    expect(reruns).toHaveLength(1)
    expect(reruns[0]).toContain('31119402753')
    expect(output).toContain('produced no verdict')
  })

  it('re-runs a base run that FAILED before executing any of our code', () => {
    // The 2026-08-07 shape: conclusion=failure, but the only failed step is the
    // runner refusing to start. That is not a verdict about the code.
    const { reruns } = runSweep({
      baseCi: baseCi('failure'),
      failedSteps: 'Set up job',
    })

    expect(reruns).toHaveLength(1)
  })

  it('refuses to merge onto a genuinely broken base, and does NOT re-run it', () => {
    const { reruns, output } = runSweep({
      baseCi: baseCi('failure'),
      failedSteps: 'Verify (lint + umlauts + typecheck + build)',
    })

    expect(reruns).toHaveLength(0)
    expect(output).toContain('refusing to merge onto a broken base')
  })

  it('does not re-run a real failure even when the jobs API says nothing', () => {
    // Empty means "we could not tell". Guessing "infra" here would re-run
    // genuine failures forever.
    const { reruns } = runSweep({ baseCi: baseCi('failure'), failedSteps: '' })

    expect(reruns).toHaveLength(0)
  })

  it('stops retrying once the run hits the attempt cap', () => {
    const { reruns, output } = runSweep({
      baseCi: baseCi('cancelled'),
      runAttempt: 3,
    })

    expect(reruns).toHaveLength(0)
    expect(output).toContain('not retrying again')
  })

  it('proceeds to the PR loop when the base is green', () => {
    const { reruns, output } = runSweep({ baseCi: baseCi('success') })

    expect(reruns).toHaveLength(0)
    expect(output).toContain('no open PRs')
  })
})
