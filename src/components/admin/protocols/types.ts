import type { ProtocolDetail, ActionLinkRecord, StructuredNotes, DecisionVoteRecord, DecisionOutcomeRecord } from '@/lib/schemas/protocols'

export interface ProtocolDetailProps {
  protocol: ProtocolDetail
  actionLinks: ActionLinkRecord[]
  teamMembers: Array<{ id: string; name: string }>
  decisionVotes: DecisionVoteRecord[]
  decisionOutcomes: DecisionOutcomeRecord[]
  currentUserId: string
  isProtocolCreator: boolean
  isSuperAdmin: boolean
  initialProcessingError?: { message: string; retryable: boolean } | null
}

export type { ProtocolDetail, ActionLinkRecord, StructuredNotes, DecisionVoteRecord, DecisionOutcomeRecord }
