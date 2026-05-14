/**
 * Protocol Components
 *
 * Decomposed from ProtocolDetailClient.tsx (934 lines) and
 * ProtocolFormClient.tsx (905 lines) into focused modules.
 * Used by: /admin/protocols/[id], /admin/protocols/new
 */

// Detail components
export { useProtocolDetail } from './useProtocolDetail'
export { ProtocolWorkflowStepper } from './ProtocolWorkflowStepper'
export { ProtocolReprocessSection } from './ProtocolReprocessSection'
export { ProtocolDraftInput } from './ProtocolDraftInput'
export { ProtocolSummarySection } from './ProtocolSummarySection'
export { ProtocolTopicsSection } from './ProtocolTopicsSection'
export { ProtocolActionItemsList } from './ProtocolActionItemsList'
export { ProtocolFollowUps } from './ProtocolFollowUps'
export { ProtocolReviewChecklist } from './ProtocolReviewChecklist'
export { ProtocolReviewQueue } from './ProtocolReviewQueue'
export type { ProtocolDetailProps } from './types'

// Form components
export { MeetingTypeStep } from './MeetingTypeStep'
export { ProtocolDetailsStep } from './ProtocolDetailsStep'
export { InputMethodStep } from './InputMethodStep'
export { ContentInputStep } from './ContentInputStep'
