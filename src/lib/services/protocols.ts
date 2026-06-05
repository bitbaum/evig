/**
 * Meeting Protocols Service Layer
 *
 * Barrel re-export from focused modules.
 * All existing imports from '@/lib/services/protocols' continue to work unchanged.
 *
 * Created: 2026-02-10
 */

// CRUD & query operations
export {
  getProtocolStats,
  getTeamMembers,
  getProtocols,
  getProtocolReviewQueue,
  getProtocolById,
  createProtocol,
  updateProtocol,
  deleteProtocol,
  finalizeProtocol,
} from './protocols-queries'

// AI processing (transcript, notes, task import)
export {
  processTranscript,
  processNotes,
  importTasks,
} from './protocols-processing'

// Action item linking (tasks & decisions)
export {
  getActionLinks,
  linkActionItemToTask,
  linkActionItemToDecision,
} from './protocols-linking'

// Decision voting & task proposals — legacy (deprecated post-QQ.6 cutover).
// New code uses the standalone decisions system; protocol action items are
// promoted to standalone decisions via the bridge (see DecisionBridge.tsx).
// Exports retained until the api routes + tables are removed in a later
// cleanup migration.
export {
  castDecisionVote,
  closeDecision,
  getDecisionData,
  generateTaskProposals,
  createProposedTasks,
} from './protocols-voting'

// QQ.6 — standalone decisions linked back to a protocol action item.
export { getDecisionsByProtocolId, type ProtocolDecisionSummary } from './decisions-crud'
