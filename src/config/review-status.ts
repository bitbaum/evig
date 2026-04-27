/**
 * Review Status Configuration
 *
 * SSOT for review moderation status labels, badges, and action labels.
 * Used by: admin reviews page, review moderation API
 */

export const REVIEW_STATUS = {
  PUBLISHED: 'published',
  PENDING_MODERATION: 'pending_moderation',
  HIDDEN: 'hidden',
  DELETED: 'deleted',
} as const

export type ReviewStatus = typeof REVIEW_STATUS[keyof typeof REVIEW_STATUS]
export const REVIEW_STATUS_VALUES = Object.values(REVIEW_STATUS) as [ReviewStatus, ...ReviewStatus[]]
export const REVIEW_MODERATION_VALUES = [REVIEW_STATUS.PUBLISHED, REVIEW_STATUS.HIDDEN, REVIEW_STATUS.DELETED] as const

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  [REVIEW_STATUS.PUBLISHED]: 'Veröffentlicht',
  [REVIEW_STATUS.PENDING_MODERATION]: 'Wartet auf Moderation',
  [REVIEW_STATUS.HIDDEN]: 'Ausgeblendet',
  [REVIEW_STATUS.DELETED]: 'Gelöscht',
}

export const REVIEW_STATUS_BADGES: Record<string, string> = {
  [REVIEW_STATUS.PUBLISHED]: 'bg-green-100 text-green-800',
  [REVIEW_STATUS.PENDING_MODERATION]: 'bg-orange-100 text-orange-800',
  [REVIEW_STATUS.HIDDEN]: 'bg-red-100 text-red-800',
  [REVIEW_STATUS.DELETED]: 'bg-gray-100 text-gray-800',
}

/** Short labels for filter tabs */
export const REVIEW_FILTER_LABELS: Record<string, string> = {
  [REVIEW_STATUS.PUBLISHED]: 'Veröffentlicht',
  [REVIEW_STATUS.PENDING_MODERATION]: 'Moderation',
  [REVIEW_STATUS.HIDDEN]: 'Ausgeblendet',
  [REVIEW_STATUS.DELETED]: 'Gelöscht',
}

/** Past-tense labels for moderation action results */
export const REVIEW_ACTION_LABELS: Record<string, string> = {
  approve: 'freigegeben',
  hide: 'ausgeblendet',
  delete: 'gelöscht',
  restore: 'wiederhergestellt',
  flag_spam: 'als Spam markiert',
  flag_inappropriate: 'als unangemessen markiert',
}

export function getReviewStatusLabel(status: string): string {
  return REVIEW_STATUS_LABELS[status] ?? 'Unbekannt'
}

export function getReviewStatusBadgeColor(status: string): string {
  return REVIEW_STATUS_BADGES[status] ?? REVIEW_STATUS_BADGES[REVIEW_STATUS.PENDING_MODERATION]
}

export function getReviewFilterLabel(status: string): string {
  return REVIEW_FILTER_LABELS[status] ?? status
}

export function getReviewActionLabel(action: string): string {
  return REVIEW_ACTION_LABELS[action] ?? 'moderiert'
}
