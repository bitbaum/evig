/**
 * Shared lifecycle core — the engine common to the three state-machine flows
 * (IT-Hilfe peer-repair, service appointments, marketplace orders).
 *
 * Two halves:
 *   - guarded-transition — race-safe WRITE (lock + re-check + apply in tx)
 *   - state-machine      — declarative transition-table VALIDATION (legality)
 */

export {
  guardedTransition,
  type Tx,
  type DbOrTx,
  type GuardedTransitionOptions,
  type GuardedTransitionResult,
} from './guarded-transition'

export {
  resolveTransition,
  canTransition,
  type Transition,
  type TransitionTable,
  type ResolveReason,
  type ResolveResult,
} from './state-machine'
