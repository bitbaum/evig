/**
 * @jest-environment node
 *
 * The main-red alarm and the auto-merge green-base guard must mean the same
 * thing by "main is green".
 *
 * They did not. The guard reads the RUN's conclusion — every job contributes.
 * The alarm recomputed its own verdict from a hand-written `needs:` list that
 * omitted two jobs. On 2026-08-07 an Actions incident cancelled Migration
 * Drift on main: the run went `failure`, auto-merge refused every merge for
 * ~14h, and the alarm — blind to that job — concluded `success` and filed
 * nothing. The queue was stopped and the thing built to say so stayed quiet.
 *
 * A hand-maintained list will drift again, so this asserts it cannot.
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

const CI_YML = resolve(__dirname, '../../../.github/workflows/ci.yml')
const ALARM_JOB = 'post-main'

const workflow = readFileSync(CI_YML, 'utf8')

/**
 * Top-level job ids, by indentation.
 *
 * Deliberately not a YAML library: neither `yaml` nor `js-yaml` is a declared
 * dependency of this repo (both are only transitively hoisted), and a test
 * that guards CI should not rest on a package that a lockfile change could
 * remove. The shape being parsed is one we own and is two levels deep.
 */
function jobIds(src: string): string[] {
  const lines = src.split('\n')
  const start = lines.findIndex((l) => /^jobs:\s*$/.test(l))
  if (start === -1) throw new Error('ci.yml has no top-level `jobs:` key')

  const ids: string[] = []
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break // dedented back to a top-level key
    const match = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line)
    if (match) ids.push(match[1])
  }
  return ids
}

/** The `needs: [...]` list of a given job. */
function needsOf(src: string, jobId: string): string[] {
  const section = src.split(new RegExp(`^ {2}${jobId}:\\s*$`, 'm'))[1]
  if (section === undefined) throw new Error(`ci.yml has no job \`${jobId}\``)
  const match = /^ {4}needs:\s*\[([^\]]*)\]/m.exec(section)
  if (!match) throw new Error(`job \`${jobId}\` declares no inline needs: [...]`)
  return match[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

describe('main-red alarm verdict', () => {
  const ids = jobIds(workflow)

  it('parses the workflow it is guarding', () => {
    // Guards the parser itself: a regex that silently matched nothing would
    // make every assertion below trivially true.
    expect(ids).toContain(ALARM_JOB)
    expect(ids.length).toBeGreaterThan(3)
  })

  it('waits for EVERY other job before deciding main is green', () => {
    const expected = ids.filter((id) => id !== ALARM_JOB).sort()
    const actual = needsOf(workflow, ALARM_JOB).sort()

    // If this fails you added a job and did not add it here. Add it to both
    // `needs:` and the R_* env block — otherwise that job can fail on main,
    // block the whole merge queue, and never raise the alarm.
    expect(actual).toEqual(expected)
  })

  it('feeds every needed job into the verdict', () => {
    const section = workflow.split(/^ {2}post-main:\s*$/m)[1]
    const referenced = new Set(
      [...section.matchAll(/needs\.([A-Za-z0-9_-]+)\.result/g)].map((m) => m[1]),
    )

    for (const id of needsOf(workflow, ALARM_JOB)) {
      // A job can be in `needs:` and still be missing from the R_* env block,
      // which reintroduces exactly the blind spot this file exists to prevent.
      expect([...referenced]).toContain(id)
    }
  })

  it('treats anything that is not success or skipped as red', () => {
    const section = workflow.split(/^ {2}post-main:\s*$/m)[1]

    // `cancelled` must NOT be carved out as its own benign conclusion: a
    // cancelled job on main blocks the queue just as hard as a failing one.
    expect(section).toMatch(/success\|skipped\)/)
    expect(section).not.toMatch(/conclusion=cancelled/)
  })
})
