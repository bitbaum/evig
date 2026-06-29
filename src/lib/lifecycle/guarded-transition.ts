/**
 * Race-safe state-transition guard — the shared core of the three lifecycle
 * flows (IT-Hilfe peer-repair, service appointments, marketplace orders).
 *
 * Every one of those flows is "a row with a `status` column moving through
 * role-gated actions". Each performs a state change as: read current state,
 * decide the transition is legal, then write. Done naively (read, then
 * `UPDATE ... WHERE id = $1`) two concurrent or double-clicked requests can
 * both pass the read-time check and both write — double-applying side-effects
 * (e.g. capturing a Payrexx payment twice, double-counting a sale).
 *
 * `guardedTransition` reproduces the proven IT-Hilfe pattern in ONE place:
 * open a transaction, `SELECT ... FOR UPDATE` the row that serializes the
 * flow, re-check the precondition under that lock, and only then run the
 * flow-specific writes inside the same transaction. The second of two racing
 * callers blocks on the row lock, then sees the already-changed state in
 * `check()` and aborts cleanly.
 *
 * The flow keeps ALL its domain logic — which tables to write, which
 * side-effects to fire — inside `apply`. This helper only owns the lock +
 * re-check + transaction scaffolding. Work that must happen AFTER the
 * transaction commits (e.g. `createReview`, notification fan-out) stays in
 * the caller, gated on a `{ ok: true }` result.
 */

import { db as defaultDb } from '@/db'
import { sql } from 'drizzle-orm'

/** The transaction handle Drizzle passes to a `db.transaction(tx => …)` callback. */
export type Tx = Parameters<Parameters<typeof defaultDb.transaction>[0]>[0]

/**
 * Either the module-level `db` (opens a fresh transaction) or an existing
 * `Tx` (reused in place — Drizzle nests it as a savepoint). No current call
 * site nests; the option exists so a future caller already inside a
 * transaction can serialize within it rather than dead-locking on itself.
 */
export type DbOrTx = typeof defaultDb | Tx

export interface GuardedTransitionOptions<Row extends Record<string, unknown>, T> {
  /**
   * Table to `SELECT ... FOR UPDATE` — the serialization point. Pass a
   * `TABLE_NAMES.*` value. Interpolated via `sql.raw`, so it MUST be a
   * trusted code literal, never user input.
   */
  lockTable: string
  /** Primary-key value of the row to lock. Bound as a parameter (safe). */
  lockId: string
  /**
   * Columns to read under the lock and hand to `check`. Trusted code
   * literals only (interpolated via `sql.raw`). Defaults to `['status']`.
   */
  lockColumns?: readonly string[]
  /**
   * Re-check the precondition under the lock. Return `false` to abort (the
   * transaction commits as a no-op and the call returns `{ ok: false }`).
   * `tx` is provided so the check can read a SECOND entity in the same
   * transaction (e.g. IT-Hilfe accept re-reads the offer status). Returns
   * `false` if the locked row does not exist.
   */
  check: (row: Row, tx: Tx) => boolean | Promise<boolean>
  /** All flow-specific writes + side-effects. Runs under the lock; its return value is surfaced as `result`. */
  apply: (tx: Tx, row: Row) => Promise<T>
  /** Connection to run on. Defaults to the module `db` (fresh transaction). Pass an existing `Tx` to reuse it. */
  db?: DbOrTx
}

export type GuardedTransitionResult<T> = { ok: true; result: T } | { ok: false }

/**
 * Run `apply` against `lockTable`/`lockId` only if `check` passes under a
 * `FOR UPDATE` lock, atomically. See file header for the rationale.
 */
export async function guardedTransition<Row extends Record<string, unknown>, T>(
  opts: GuardedTransitionOptions<Row, T>,
): Promise<GuardedTransitionResult<T>> {
  const { lockTable, lockId, lockColumns = ['status'], check, apply } = opts
  const conn = opts.db ?? defaultDb

  const columns = sql.raw(lockColumns.join(', '))
  const table = sql.raw(lockTable)

  const run = async (tx: Tx): Promise<GuardedTransitionResult<T>> => {
    const locked = await tx.execute(
      sql`SELECT ${columns} FROM ${table} WHERE id = ${lockId} FOR UPDATE`,
    )
    const row = locked.rows[0] as Row | undefined
    if (!row) return { ok: false }

    if (!(await check(row, tx))) return { ok: false }

    const result = await apply(tx, row)
    return { ok: true, result }
  }

  // `db.transaction` opens a fresh transaction; a passed-in `Tx` is reused in
  // place (it exposes the same `transaction` method, nesting via savepoint).
  return conn.transaction(run)
}
