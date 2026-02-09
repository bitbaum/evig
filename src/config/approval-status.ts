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
    color: 'text-green-800 dark:text-green-300',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  [APPROVAL_STATUS.REJECTED]: {
    label: 'Abgelehnt',
    color: 'text-red-800 dark:text-red-300',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
  [APPROVAL_STATUS.REQUIRES_CHANGES]: {
    label: 'Änderungen erforderlich',
    color: 'text-orange-800 dark:text-orange-300',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  [APPROVAL_STATUS.PUBLISHED]: {
    label: 'Veröffentlicht',
    color: 'text-blue-800 dark:text-blue-300',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
}

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
    color: 'text-gray-800 dark:text-gray-300',
    bg: 'bg-gray-100 dark:bg-gray-900/30',
  }
}
