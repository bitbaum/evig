/**
 * Shared Approval Status Configuration
 *
 * SSOT for generic approval flow labels and badges.
 * Used by: content submissions, repairer applications, blog submissions, workshop proposals
 *
 * Domain-specific status flows (booking, IT-Hilfe, tasks) remain in their own configs.
 */

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REQUIRES_CHANGES: 'requires_changes',
  PUBLISHED: 'published',
} as const

export type ApprovalStatus = typeof APPROVAL_STATUS[keyof typeof APPROVAL_STATUS]

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  [APPROVAL_STATUS.PENDING]: 'Ausstehend',
  [APPROVAL_STATUS.APPROVED]: 'Genehmigt',
  [APPROVAL_STATUS.REJECTED]: 'Abgelehnt',
  [APPROVAL_STATUS.REQUIRES_CHANGES]: 'Änderungen erforderlich',
  [APPROVAL_STATUS.PUBLISHED]: 'Veröffentlicht',
}

export interface ApprovalBadge {
  label: string
  color: string
  bg: string
}

export const APPROVAL_STATUS_BADGES: Record<string, ApprovalBadge> = {
  [APPROVAL_STATUS.PENDING]: {
    label: 'Ausstehend',
    color: 'text-yellow-800 dark:text-yellow-300',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  [APPROVAL_STATUS.APPROVED]: {
    label: 'Genehmigt',
    color: 'text-primary-800 dark:text-primary-300',
    bg: 'bg-primary-100 dark:bg-primary-900/30',
  },
  [APPROVAL_STATUS.REJECTED]: {
    label: 'Abgelehnt',
    color: 'text-error-800 dark:text-error-300',
    bg: 'bg-error-100 dark:bg-error-900/30',
  },
  [APPROVAL_STATUS.REQUIRES_CHANGES]: {
    label: 'Änderungen erforderlich',
    color: 'text-orange-800 dark:text-orange-300',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  [APPROVAL_STATUS.PUBLISHED]: {
    label: 'Veröffentlicht',
    color: 'text-info-800 dark:text-info-300',
    bg: 'bg-info-100 dark:bg-info-900/30',
  },
}

export const SUBMISSION_CONTENT_TYPE = {
  WORKSHOP: 'workshop',
  BLOG_POST: 'blog_post',
  PRODUCT: 'product',
  SERVICE: 'service',
  LISTING: 'listing',
} as const

export type SubmissionContentType = typeof SUBMISSION_CONTENT_TYPE[keyof typeof SUBMISSION_CONTENT_TYPE]

export const SUBMISSION_CONTENT_TYPE_LABELS: Record<string, string> = {
  [SUBMISSION_CONTENT_TYPE.WORKSHOP]: 'Workshop',
  [SUBMISSION_CONTENT_TYPE.BLOG_POST]: 'Blog-Artikel',
  [SUBMISSION_CONTENT_TYPE.PRODUCT]: 'Produkt',
  [SUBMISSION_CONTENT_TYPE.SERVICE]: 'Dienstleistung',
  [SUBMISSION_CONTENT_TYPE.LISTING]: 'Inserat',
}

export const BLOG_SUBMISSION_TYPE = {
  IDEA: 'idea',
  DRAFT: 'draft',
} as const

export type BlogSubmissionType = typeof BLOG_SUBMISSION_TYPE[keyof typeof BLOG_SUBMISSION_TYPE]

/**
 * Get approval status label
 */
export function getApprovalStatusLabel(status: string): string {
  return APPROVAL_STATUS_LABELS[status] ?? status
}

/**
 * Get approval status badge with label and styling
 */
export function getApprovalStatusBadge(status: string): ApprovalBadge {
  return APPROVAL_STATUS_BADGES[status] ?? {
    label: status,
    color: 'text-neutral-800 dark:text-neutral-300',
    bg: 'bg-neutral-100 dark:bg-neutral-900/30',
  }
}
