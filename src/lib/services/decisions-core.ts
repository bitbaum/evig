/**
 * Decisions & Voting — Core Re-exports
 *
 * Thin orchestrator that re-exports from focused modules so existing
 * imports from 'decisions-core' continue to work unchanged.
 */

// CRUD operations + shared types/helpers
export type { DbDecisionRow, DecisionStats } from './decisions-crud';
export {
  asArray,
  asObject,
  getDecisionStats,
  getDecisions,
  getDecisionById,
  createDecision,
  updateDecision,
  deleteDecision,
} from './decisions-crud';

// State transitions
export { transitionDecision } from './decisions-transitions';

// Tally computation
export { computeTallies } from './decisions-voting';
