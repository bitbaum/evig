/**
 * Review-workflow core — the ONE recipe for "a row with a status column that
 * an actor reviews": validate the transition against a declarative table,
 * enforce named guards (four-eyes, payroll-lock, super-admin-only) under a
 * FOR UPDATE lock, write the standard review columns per action policy, run
 * domain writes in the same transaction, and dispatch side-effect events
 * strictly AFTER commit.
 *
 * Built on the existing lifecycle pieces: `resolveTransition` (legality) and
 * `guardedTransition` (race safety). SQL-name based like guardedTransition —
 * NOT Drizzle-table based — because several domains (time-off) have no
 * Drizzle model and live on raw `query()` SQL. All table/column names must be
 * trusted code literals (TABLE_NAMES.* / config), never user input.
 *
 * Failure codes are stable API: routes map them to their existing HTTP
 * contracts, and the timecard bulk-review loop maps them to per-id errors.
 */

import { sql } from 'drizzle-orm'
import { db as defaultDb } from '@/db'
import { guardedTransition, type DbOrTx, type Tx } from './guarded-transition'
import { resolveTransition, type TransitionTable, type ResolveReason } from './state-machine'
import { dispatchWorkflowEvent, type WorkflowEvent } from './dispatch'
import { logger } from '@/lib/logger'

/** SQL-name target. Column defaults match the dominant convention. */
export interface ReviewTarget {
  /** TABLE_NAMES.* literal (interpolated via sql.raw — trusted code only). */
  table: string
  columns?: {
    status?: string            // default 'status'
    reviewedBy?: string | null // default 'reviewed_by'; null = table has no such column
    reviewedAt?: string | null // default 'reviewed_at'
    reason?: string | null     // default 'review_notes'
    updatedAt?: string | null  // default 'updated_at'
  }
  /** Extra columns read under the lock and exposed on `row` (owner id, title, …). */
  select?: readonly string[]
}

export interface ReviewActor {
  id: string
  /** Role resolved by the caller for role-gated transition tables. */
  role?: string | null
}

/** Named precondition checked under the lock. First failure wins. */
export interface ReviewGuard<Row> {
  /** Stable code surfaced in the result (e.g. 'self_review', 'payroll_locked'). */
  code: string
  check: (row: Row, actor: ReviewActor) => boolean | Promise<boolean>
}

export type ReviewFailure =
  | { ok: false; code: 'not_found' }
  | { ok: false; code: 'invalid_transition'; reason: ResolveReason; from: string }
  /** The transition was legal at pre-check but not under the lock — a racer won. */
  | { ok: false; code: 'conflict' }
  | { ok: false; code: 'guard_failed'; guard: string }

export type ReviewResult<Row> =
  | { ok: true; row: Row; from: string; to: string | null }
  | ReviewFailure

interface WritePolicy<Row> {
  /** 'set' writes the reason (or NULL when absent); 'skip' leaves the column; 'clear' NULLs it. */
  reason?: 'set' | 'skip' | 'clear'
  /** 'set' stamps actor + NOW(); 'clear' NULLs both (reopen semantics). */
  reviewer?: 'set' | 'clear'
  /** Additional same-table column values (names trusted, values bound). */
  extra?: (row: Row) => Record<string, unknown>
}

export interface RunReviewTransitionOptions<
  Row extends Record<string, unknown>,
  A extends string = string,
> {
  target: ReviewTarget
  transitions: TransitionTable<string, A, string>
  id: string
  action: A
  actor: ReviewActor
  guards?: readonly ReviewGuard<Row>[]
  reason?: string | null
  write?: Partial<Record<A, WritePolicy<Row>>>
  /** Domain writes inside the transaction, after the standard UPDATE. */
  applyInTxn?: (tx: Tx, row: Row, ctx: { from: string; to: string | null; action: A }) => Promise<void>
  /**
   * Build side-effect events — dispatched AFTER the transaction commits.
   * Never runs when the transition failed or rolled back.
   */
  emit?: (row: Row, ctx: { from: string; to: string | null; action: A }) =>
    WorkflowEvent | readonly WorkflowEvent[] | null | Promise<WorkflowEvent | readonly WorkflowEvent[] | null>
  db?: DbOrTx
}

const DEFAULT_COLUMNS = {
  status: 'status',
  reviewedBy: 'reviewed_by' as string | null,
  reviewedAt: 'reviewed_at' as string | null,
  reason: 'review_notes' as string | null,
  updatedAt: 'updated_at' as string | null,
}

export async function runReviewTransition<
  Row extends Record<string, unknown>,
  A extends string = string,
>(opts: RunReviewTransitionOptions<Row, A>): Promise<ReviewResult<Row>> {
  const conn = opts.db ?? defaultDb
  const cols = { ...DEFAULT_COLUMNS, ...opts.target.columns }
  const statusCol = cols.status

  // Everything read under the lock: status + caller's select list, deduped.
  const lockColumns = Array.from(new Set([statusCol, ...(opts.target.select ?? [])]))

  // Fast pre-check WITHOUT the lock: gives precise invalid_transition responses
  // (including the offending `from`) without opening a transaction. The
  // authoritative re-check happens under the lock; a mismatch there is a
  // `conflict` (someone else transitioned the row between read and lock).
  const preRead = await conn.execute(
    sql`SELECT ${sql.raw(lockColumns.join(', '))} FROM ${sql.raw(opts.target.table)} WHERE id = ${opts.id}`,
  )
  const preRow = preRead.rows[0] as Row | undefined
  if (!preRow) return { ok: false, code: 'not_found' }

  const preFrom = String(preRow[statusCol])
  const preResolve = resolveTransition(opts.transitions, {
    from: preFrom,
    action: opts.action,
    role: opts.actor.role ?? undefined,
  })
  if (!preResolve.ok) {
    return { ok: false, code: 'invalid_transition', reason: preResolve.reason, from: preFrom }
  }

  // Captured inside check() so the caller learns WHICH precondition failed —
  // guardedTransition's boolean check can't carry that itself.
  let failure: ReviewFailure | null = null
  let committed: { row: Row; from: string; to: string | null } | null = null

  const guarded = await guardedTransition<Row, void>({
    lockTable: opts.target.table,
    lockId: opts.id,
    lockColumns,
    db: opts.db,
    check: async (row) => {
      const from = String(row[statusCol])
      const resolved = resolveTransition(opts.transitions, {
        from,
        action: opts.action,
        role: opts.actor.role ?? undefined,
      })
      if (!resolved.ok) {
        failure = { ok: false, code: 'conflict' }
        return false
      }
      for (const guard of opts.guards ?? []) {
        if (!(await guard.check(row, opts.actor))) {
          failure = { ok: false, code: 'guard_failed', guard: guard.code }
          return false
        }
      }
      return true
    },
    apply: async (tx, row) => {
      const from = String(row[statusCol])
      const resolved = resolveTransition(opts.transitions, {
        from,
        action: opts.action,
        role: opts.actor.role ?? undefined,
      })
      const to = resolved.ok ? resolved.to : null

      const policy: WritePolicy<Row> = opts.write?.[opts.action] ?? {}
      const reasonMode = policy.reason ?? 'set'
      const reviewerMode = policy.reviewer ?? 'set'

      const sets: ReturnType<typeof sql>[] = []
      if (to !== null) sets.push(sql`${sql.raw(statusCol)} = ${to}`)
      if (cols.reviewedBy) {
        sets.push(reviewerMode === 'set'
          ? sql`${sql.raw(cols.reviewedBy)} = ${opts.actor.id}`
          : sql`${sql.raw(cols.reviewedBy)} = NULL`)
      }
      if (cols.reviewedAt) {
        sets.push(reviewerMode === 'set'
          ? sql`${sql.raw(cols.reviewedAt)} = NOW()`
          : sql`${sql.raw(cols.reviewedAt)} = NULL`)
      }
      if (cols.reason && reasonMode !== 'skip') {
        sets.push(reasonMode === 'set'
          ? sql`${sql.raw(cols.reason)} = ${opts.reason ?? null}`
          : sql`${sql.raw(cols.reason)} = NULL`)
      }
      if (cols.updatedAt) sets.push(sql`${sql.raw(cols.updatedAt)} = NOW()`)
      for (const [col, value] of Object.entries(policy.extra?.(row) ?? {})) {
        sets.push(sql`${sql.raw(col)} = ${value as string | number | boolean | null}`)
      }

      if (sets.length > 0) {
        await tx.execute(
          sql`UPDATE ${sql.raw(opts.target.table)} SET ${sql.join(sets, sql`, `)} WHERE id = ${opts.id}`,
        )
      }

      await opts.applyInTxn?.(tx, row, { from, to, action: opts.action })
      committed = { row, from, to }
    },
  })

  if (!guarded.ok) {
    if (guarded.reason === 'not_found') return { ok: false, code: 'not_found' }
    return failure ?? { ok: false, code: 'conflict' }
  }

  // committed is always set when guardedTransition succeeded.
  const done = committed as unknown as { row: Row; from: string; to: string | null }

  // Post-commit side effects — outside the lock, isolated from the caller.
  if (opts.emit) {
    try {
      const events = await opts.emit(done.row, { from: done.from, to: done.to, action: opts.action })
      const list = events == null ? [] : Array.isArray(events) ? events : [events]
      for (const event of list) {
        await dispatchWorkflowEvent(event)
      }
    } catch (error) {
      logger.warn('review-workflow emit failed', { table: opts.target.table, id: opts.id, action: opts.action, error })
    }
  }

  return { ok: true, row: done.row, from: done.from, to: done.to }
}
