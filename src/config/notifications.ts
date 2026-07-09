/**
 * Notification Configuration (SSOT)
 *
 * All notification types and navigation hrefs live here. This config + zod at
 * the write boundary is the ONLY enum authority — the old `notifications_type_check`
 * DB constraint was dropped in migration 110 (it drifted repeatedly). Adding a
 * type here needs no migration.
 */

export const NOTIFICATION_TYPES = {
  // Decision system
  DECISION_VOTING: 'decision_voting',
  DECISION_CLOSED: 'decision_closed',
  DECISION_DEADLINE: 'decision_deadline',

  // Protocols
  PROTOCOL_FINALIZED: 'protocol_finalized',

  // Task management
  TASK_ASSIGNED: 'task_assigned',
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

  // Generic user content submissions (workshops, blog posts via user_content_submissions)
  CONTENT_SUBMISSION_STATUS: 'content_submission_status',

  // Membership (join is instant — the only notification is payment confirmation)
  MEMBERSHIP_PAYMENT_RECORDED: 'membership_payment_recorded',

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

  // Timecards
  TIMECARD_SUBMITTED: 'timecard_submitted',
  // Confirmation to the person who submitted (distinct from the approver
  // "needs review" notification above) — also the "you can approve it yourself"
  // prompt when the submitter is the sole approver.
  TIMECARD_SUBMIT_CONFIRMED: 'timecard_submit_confirmed',
  TIMECARD_REVIEWED: 'timecard_reviewed',

  // Permission requests
  PERMISSION_REQUEST_SUBMITTED: 'permission_request_submitted',
  PERMISSION_REQUEST_REVIEWED: 'permission_request_reviewed',

  // HR / Careers
  JOB_APPLICATION_RECEIVED: 'job_application_received',
  JOB_APPLICATION_STATUS: 'job_application_status',
  VACANCY_PUBLISHED: 'vacancy_published',
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
  ORDER: 'order',
  TIME_OFF: 'time_off',
  TIME_OFF_REVIEW: 'time_off_review',
  TIMECARD: 'timecard',
  TIMECARD_REVIEW: 'timecard_review',
  JOB_APPLICATION: 'job_application',
  JOB_VACANCY: 'job_vacancy',
} as const

export type RelatedType = typeof RELATED_TYPES[keyof typeof RELATED_TYPES]

import { SERVICE_APPOINTMENT_ROUTES } from '@/config/service-appointments'

/** Maps `related_type` to the base route for navigation in NotificationBell */
export const RELATED_TYPE_HREFS: Record<string, string> = {
  [RELATED_TYPES.TASK]: '/admin/tasks/',
  [RELATED_TYPES.PROTOCOL]: '/admin/protocols/',
  [RELATED_TYPES.DECISION]: '/admin/decisions/',
  [RELATED_TYPES.CONVERSATION]: '/dashboard/messages?conversation=',
  [RELATED_TYPES.APPOINTMENT]: SERVICE_APPOINTMENT_ROUTES.notificationBase,
  [RELATED_TYPES.IT_HILFE]: '/it-hilfe/',
  [RELATED_TYPES.WORKSHOP]: '/admin/workshops/instances/',
  [RELATED_TYPES.WORKSHOP_PROPOSAL]: '/admin/workshops/proposals/',
  // Membership notifications go to the MEMBER (not staff) → member-facing page.
  [RELATED_TYPES.MEMBERSHIP]: '/dashboard/membership?ref=',
  [RELATED_TYPES.LISTING]: '/admin/marketplace?listing=',
  // Order notifications go to the SELLER (often a P2P community member, not
  // staff) → their own order view, not the admin surface.
  [RELATED_TYPES.ORDER]: '/dashboard/orders/',
  // timecards has no [id] detail page — land on the flat queue and pass the
  // request id as a harmless query param (same append pattern as CONVERSATION),
  // so relatedHref() can't produce a broken "/admin/zeiterfassung<id>" path.
  [RELATED_TYPES.TIME_OFF]: '/admin/zeiterfassung?id=', // requester → their tool
  [RELATED_TYPES.TIME_OFF_REVIEW]: '/admin/team/approvals?id=', // approver → the queue
  [RELATED_TYPES.TIMECARD]: '/admin/zeiterfassung?id=',
  [RELATED_TYPES.TIMECARD_REVIEW]: '/admin/team/approvals?id=',
  [RELATED_TYPES.JOB_APPLICATION]: '/admin/hr/applications/',
  [RELATED_TYPES.JOB_VACANCY]: '/admin/hr/vacancies/',
}
