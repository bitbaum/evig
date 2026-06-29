/**
 * Shared lifecycle core — the engine common to the three state-machine flows
 * (IT-Hilfe peer-repair, service appointments, marketplace orders).
 *
 * Phase 1 exposes the race-safe transition guard. The declarative
 * transition-table validator (Phase 2) is intentionally not here yet.
 */

export {
  guardedTransition,
  type Tx,
  type DbOrTx,
  type GuardedTransitionOptions,
  type GuardedTransitionResult,
} from './guarded-transition'
