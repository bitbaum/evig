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
  recoverStaleProtocolProcessing,
} from './protocols-processing'

// Action item linking (tasks & decisions)
export {
  getActionLinks,
  linkActionItemToTask,
  linkActionItemToDecision,
} from './protocols-linking'

// QQ.6 — standalone decisions linked back to a protocol action item.
export { getDecisionsByProtocolId, type ProtocolDecisionSummary } from './decisions-crud'

// Protocol decision → task bridge (post-QQ.6)
export {
  createFollowUpTaskFromDecision,
  getTaskProtocolSource,
  getDecisionOutcomePassed,
  buildFollowUpTaskPayload,
} from './protocol-decision-tasks'
