/**
 * Declarative state-machine validator — the second half of the shared
 * lifecycle core (Phase 2). It answers ONE question for a flow: given the
 * current status, an actor's role, and the action they want, is the
 * transition legal, and what is the target status?
 *
 * Each flow declares its OWN transition table (a list of `Transition` rows)
 * and shares this one validator, replacing the three bespoke mechanisms that
 * grew up independently (a `Record<status, next[]>` map, a `switch`, and a
 * `Record<status, Record<role, next[]>>` matrix). One shape, one validator,
 * impossible to drift, and the table is auditable data — "what can a buyer
 * do to a paid order?" is now a value you can read, not control flow.
 *
 * The race-safe WRITE side lives in `./guarded-transition`. This module is
 * pure (no DB) — it only decides legality. IT-Hilfe deliberately does NOT use
 * it: its OPEN→MATCHED is a two-entity offer acceptance, not a single-row
 * status transition, so a table shape would add indirection without removing
 * complexity.
 */

/**
 * One legal transition: performing `action` (as `role`) from any status in
 * `from` moves the row to `to`. `to` is omitted for actions that are gated
 * by role/state but change no status (e.g. an appointment "rate" or "update").
 * `role` omitted = any actor.
 */
export interface Transition<
  S extends string = string,
  A extends string = string,
  R extends string = string,
> {
  action: A
  from: S | readonly S[]
  role?: R | readonly R[]
  /** Target status. Omit for non-status-changing actions (resolve returns `to: null`). */
  to?: S
}

export type TransitionTable<
  S extends string = string,
  A extends string = string,
  R extends string = string,
> = readonly Transition<S, A, R>[]

export type ResolveReason = 'unknown_action' | 'wrong_role' | 'wrong_state'

export type ResolveResult<S extends string = string> =
  | { ok: true; to: S | null }
  | { ok: false; reason: ResolveReason }

function toArray<T>(v: T | readonly T[] | undefined): readonly T[] | undefined {
  if (v === undefined) return undefined
  return Array.isArray(v) ? (v as readonly T[]) : ([v] as readonly T[])
}

function roleMatches<R extends string>(
  transitionRole: R | readonly R[] | undefined,
  actorRole: R | null | undefined,
): boolean {
  // A transition with no `role` is open to any actor.
  if (transitionRole === undefined) return true
  if (actorRole == null) return false
  return toArray(transitionRole)!.includes(actorRole)
}

function fromMatches<S extends string>(from: S | readonly S[], current: S): boolean {
  return toArray(from)!.includes(current)
}

/**
 * Resolve `{ from, action, role }` against a transition table.
 *
 * Reason priority (mirrors hand-rolled "check role, then state" gates):
 *   - no row for `action`                         → unknown_action
 *   - row(s) exist, none match the actor's role   → wrong_role
 *   - role matches but `from` doesn't             → wrong_state
 *
 * Multiple rows may share an action (e.g. an order may be cancellable from
 * several states by different roles); the first row matching both role and
 * `from` wins.
 */
export function resolveTransition<S extends string, A extends string, R extends string>(
  table: TransitionTable<S, A, R>,
  input: { from: S; action: A; role?: R | null },
): ResolveResult<S> {
  const candidates = table.filter((t) => t.action === input.action)
  if (candidates.length === 0) return { ok: false, reason: 'unknown_action' }

  const roleOk = candidates.filter((t) => roleMatches(t.role, input.role))
  if (roleOk.length === 0) return { ok: false, reason: 'wrong_role' }

  const match = roleOk.find((t) => fromMatches(t.from, input.from))
  if (!match) return { ok: false, reason: 'wrong_state' }

  return { ok: true, to: match.to ?? null }
}

/** Convenience boolean check when the caller doesn't need the reason or target. */
export function canTransition<S extends string, A extends string, R extends string>(
  table: TransitionTable<S, A, R>,
  input: { from: S; action: A; role?: R | null },
): boolean {
  return resolveTransition(table, input).ok
}
