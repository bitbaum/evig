/**
 * Membership application status constants — SSOT.
 * Covers both the application lifecycle and the ongoing member status.
 */

// Joining is INSTANT (see /api/membership/apply): the application row is a
// historical record inserted directly as 'approved', never a review queue.
// 'pending'/'rejected' remain for legacy rows; there is no approval workflow.
export const MEMBERSHIP_APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export type MembershipApplicationStatus =
  (typeof MEMBERSHIP_APPLICATION_STATUS)[keyof typeof MEMBERSHIP_APPLICATION_STATUS]

export const MEMBERSHIP_APPLICATION_STATUS_LABELS: Record<MembershipApplicationStatus, string> = {
  pending: 'Ausstehend',
  approved: 'Genehmigt',
  rejected: 'Abgelehnt',
}

// Matches the users.member_type CHECK constraint (migration 062):
// regular | reduced | honorary. The public form offers regular/reduced;
// honorary is set by staff.
export const MEMBERSHIP_TYPE = {
  REGULAR: 'regular',
  REDUCED: 'reduced',
  HONORARY: 'honorary',
} as const

export type MembershipType = (typeof MEMBERSHIP_TYPE)[keyof typeof MEMBERSHIP_TYPE]

export const MEMBERSHIP_TYPE_LABELS: Record<MembershipType, string> = {
  regular: 'Ordentliches Mitglied',
  reduced: 'Ermässigtes Mitglied',
  honorary: 'Ehrenmitglied',
}
