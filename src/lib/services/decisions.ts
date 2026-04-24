/**
 * Decisions & Voting Service Layer
 *
 * Barrel re-export from focused modules.
 * All existing imports from '@/lib/services/decisions' continue to work unchanged.
 */

// Core CRUD, transitions, tally computation
export type { DecisionStats, PublicDecision, PublicDecisionOption } from './decisions-core'
export {
  getDecisionStats,
  getDecisions,
  getDecisionById,
  getPublicDecision,
  createDecision,
  updateDecision,
  deleteDecision,
  transitionDecision,
  computeTallies,
} from './decisions-core'

// Voting submission, retrieval, participation
export {
  validateVoteData,
  submitVote,
  getVotes,
  getParticipationStatus,
} from './decisions-voting'

// Comments CRUD
export {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from './decisions-comments'
