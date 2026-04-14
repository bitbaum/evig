/**
 * Repairer / technician profile status constants — SSOT.
 */

export const REPAIRER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const

export type RepairerStatus = (typeof REPAIRER_STATUS)[keyof typeof REPAIRER_STATUS]

export const REPAIRER_STATUS_LABELS: Record<RepairerStatus, string> = {
  active: 'Aktiv',
  inactive: 'Inaktiv',
  suspended: 'Gesperrt',
  pending: 'Ausstehend',
}

export const REPAIRER_APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export type RepairerApplicationStatus =
  (typeof REPAIRER_APPLICATION_STATUS)[keyof typeof REPAIRER_APPLICATION_STATUS]

export const REPAIRER_APPLICATION_STATUS_LABELS: Record<RepairerApplicationStatus, string> = {
  pending: 'Ausstehend',
  approved: 'Genehmigt',
  rejected: 'Abgelehnt',
}
