/**
 * Notification Configuration (SSOT)
 *
 * All notification types and navigation hrefs live here.
 * DB CHECK constraint must match these types — see migration 039.
 */

export const NOTIFICATION_TYPES = {
  // Decision system
  DECISION_VOTING: 'decision_voting',
  DECISION_CLOSED: 'decision_closed',
  DECISION_DEADLINE: 'decision_deadline',

  // Protocols
  PROTOCOL_FINALIZED: 'protocol_finalized',

  // Task management
  TASK_ATTENTION: 'task_attention',
  TASK_REQUEST: 'task_request',
  TASK_REQUEST_RESPONSE: 'task_request_response',
  TASK_COMPLETED: 'task_completed',
  TASK_BROADCAST: 'task_broadcast',

  // IT-Hilfe
  IT_HILFE_REQUEST_CONFIRMATION: 'it_hilfe_request_confirmation',
  IT_HILFE_MATCHING_REQUEST: 'it_hilfe_matching_request',
  IT_HILFE_NEW_OFFER: 'it_hilfe_new_offer',
  IT_HILFE_OFFER_ACCEPTED: 'it_hilfe_offer_accepted',
  IT_HILFE_OFFER_REJECTED: 'it_hilfe_offer_rejected',
  IT_HILFE_REQUEST_COMPLETED: 'it_hilfe_request_completed',
  IT_HILFE_REVIEW_RECEIVED: 'it_hilfe_review_received',

  // Blog submissions
  BLOG_SUBMISSION_STATUS: 'blog_submission_status',

  // Membership
  MEMBERSHIP_APPROVED: 'membership_approved',

  // Workshops
  WORKSHOP_PROPOSAL_APPROVED: 'workshop_proposal_approved',

  // Marketplace
  LISTING_SOLD: 'listing_sold',

  // Service appointments
  SERVICE_APPOINTMENT_ASSIGNED: 'service_appointment_assigned',
  SERVICE_APPOINTMENT_COMPLETED: 'service_appointment_completed',

  // Time-off requests
  TIME_OFF_REQUESTED: 'time_off_requested',
  TIME_OFF_REVIEWED: 'time_off_reviewed',

  // Core
  MESSAGE: 'message',
  APPOINTMENT: 'appointment',
  MARKETPLACE: 'marketplace',
  SYSTEM: 'system',
  MARKETING: 'marketing',
} as const

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES]

export const RELATED_TYPES = {
  TASK: 'task',
  PROTOCOL: 'protocol',
  DECISION: 'decision',
  CONVERSATION: 'conversation',
  APPOINTMENT: 'appointment',
  IT_HILFE: 'it_hilfe',
  WORKSHOP: 'workshop',
  WORKSHOP_PROPOSAL: 'workshop_proposal',
  MEMBERSHIP: 'membership',
  LISTING: 'listing',
  TIME_OFF: 'time_off',
  TIME_OFF_REVIEW: 'time_off_review',
} as const

export type RelatedType = typeof RELATED_TYPES[keyof typeof RELATED_TYPES]

/** Maps `related_type` to the base route for navigation in NotificationBell */
export const RELATED_TYPE_HREFS: Record<string, string> = {
  [RELATED_TYPES.TASK]: '/admin/tasks/',
  [RELATED_TYPES.PROTOCOL]: '/admin/protocols/',
  [RELATED_TYPES.DECISION]: '/admin/decisions/',
  [RELATED_TYPES.CONVERSATION]: '/dashboard/messages?conversation=',
  [RELATED_TYPES.APPOINTMENT]: '/dashboard/appointments/',
  [RELATED_TYPES.IT_HILFE]: '/it-hilfe/',
  [RELATED_TYPES.WORKSHOP]: '/admin/workshops/',
  [RELATED_TYPES.WORKSHOP_PROPOSAL]: '/admin/workshops/proposals/',
  [RELATED_TYPES.MEMBERSHIP]: '/admin/membership/',
  [RELATED_TYPES.LISTING]: '/admin/marketplace/',
  [RELATED_TYPES.TIME_OFF]: '/dashboard/timecards', // requester → their tool
  [RELATED_TYPES.TIME_OFF_REVIEW]: '/admin/timecards', // approver → the queue
}
