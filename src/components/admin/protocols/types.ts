import type { ProtocolDetail, ActionLinkRecord, StructuredNotes } from '@/lib/schemas/protocols'
import type { ProtocolDecisionSummary } from '@/lib/services/decisions-crud'

export interface ProtocolDetailProps {
  protocol: ProtocolDetail
  actionLinks: ActionLinkRecord[]
  teamMembers: Array<{ id: string; name: string; open_task_count: number }>
  // QQ.6 — standalone decisions linked to this protocol's action items.
  // Replaces legacy decisionVotes/decisionOutcomes (protocol_decision_*).
  protocolDecisions: ProtocolDecisionSummary[]
  currentUserId: string
  isProtocolCreator: boolean
  isSuperAdmin: boolean
  initialProcessingError?: { message: string; retryable: boolean } | null
}

export type { ProtocolDetail, ActionLinkRecord, StructuredNotes, ProtocolDecisionSummary }
