/**
 * Shared lifecycle core.
 *
 * Four pieces:
 *   - guarded-transition — race-safe WRITE (lock + re-check + apply in tx)
 *   - state-machine      — declarative transition-table VALIDATION (legality)
 *   - review-workflow    — the full review recipe on top of both: guards
 *                          (four-eyes, payroll-lock, …), per-action column
 *                          policy, in-txn domain writes, post-commit events
 *   - dispatch           — ONE side-effect fan-out (in-app+email / activity /
 *                          audit) with a uniform never-throw failure policy
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

// review-workflow + dispatch are intentionally NOT re-exported here: they
// transitively import the notification/audit services, and pulling those into
// this barrel would bloat every consumer that only needs the lock or the
// validator (and break their focused test mocks). Import them directly:
//   import { runReviewTransition } from '@/lib/lifecycle/review-workflow'
//   import { dispatchWorkflowEvent } from '@/lib/lifecycle/dispatch'
