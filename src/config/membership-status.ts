/**
 * Membership application status constants — SSOT.
 * Covers both the application lifecycle and the ongoing member status.
 */

export const MEMBERSHIP_APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const

export type MembershipApplicationStatus =
  (typeof MEMBERSHIP_APPLICATION_STATUS)[keyof typeof MEMBERSHIP_APPLICATION_STATUS]

export const MEMBERSHIP_APPLICATION_STATUS_LABELS: Record<MembershipApplicationStatus, string> = {
  pending: 'Ausstehend',
  approved: 'Genehmigt',
  rejected: 'Abgelehnt',
  withdrawn: 'Zurückgezogen',
}

export const MEMBERSHIP_TYPE = {
  REGULAR: 'regular',
  REDUCED: 'reduced',
  HONORARY: 'honorary',
  SUPPORTING: 'supporting',
} as const

export type MembershipType = (typeof MEMBERSHIP_TYPE)[keyof typeof MEMBERSHIP_TYPE]

export const MEMBERSHIP_TYPE_LABELS: Record<MembershipType, string> = {
  regular: 'Ordentliches Mitglied',
  reduced: 'Ermässigtes Mitglied',
  honorary: 'Ehrenmitglied',
  supporting: 'Fördermitglied',
}
