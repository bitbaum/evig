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

  // Protocols
  PROTOCOL_FINALIZED: 'protocol_finalized',

  // Task management
  TASK_ATTENTION: 'task_attention',
  TASK_REQUEST: 'task_request',
  TASK_REQUEST_RESPONSE: 'task_request_response',
  TASK_COMPLETED: 'task_completed',
  TASK_BROADCAST: 'task_broadcast',

  // IT-Hilfe
  IT_HILFE_NEW_OFFER: 'it_hilfe_new_offer',
  IT_HILFE_OFFER_ACCEPTED: 'it_hilfe_offer_accepted',
  IT_HILFE_OFFER_REJECTED: 'it_hilfe_offer_rejected',
  IT_HILFE_REQUEST_COMPLETED: 'it_hilfe_request_completed',

  // Core
  MESSAGE: 'message',
  APPOINTMENT: 'appointment',
  MARKETPLACE: 'marketplace',
  SYSTEM: 'system',
  MARKETING: 'marketing',
} as const

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES]

/** Maps `related_type` to the base route for navigation in NotificationBell */
export const RELATED_TYPE_HREFS: Record<string, string> = {
  task: '/admin/tasks/',
  protocol: '/admin/protocols/',
  decision: '/admin/decisions/',
  conversation: '/messages/',
  appointment: '/dashboard/appointments/',
  it_hilfe: '/it-hilfe/',
}
