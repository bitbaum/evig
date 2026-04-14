/**
 * Document Status Constants (SSOT)
 * Used for repairer application document review.
 */

export const DOCUMENT_STATUS = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  /** Application-level aggregated status: set when a required document is rejected */
  INCOMPLETE: 'incomplete',
} as const;

export type DocumentStatus = typeof DOCUMENT_STATUS[keyof typeof DOCUMENT_STATUS];

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: 'Ausstehend',
  in_review: 'In Prüfung',
  approved: 'Genehmigt',
  rejected: 'Abgelehnt',
  incomplete: 'Unvollständig',
};
