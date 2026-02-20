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

// Decision voting & task proposals
export {
  castDecisionVote,
  closeDecision,
  getDecisionData,
  generateTaskProposals,
  createProposedTasks,
} from './protocols-voting'
