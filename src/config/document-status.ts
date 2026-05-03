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

export interface DocumentStatusBadge {
  label: string
  bg: string
  color: string
}

export const DOCUMENT_STATUS_BADGES: Record<string, DocumentStatusBadge> = {
  [DOCUMENT_STATUS.APPROVED]: { label: DOCUMENT_STATUS_LABELS.approved, bg: 'bg-primary-100', color: 'text-primary-800' },
  [DOCUMENT_STATUS.IN_REVIEW]: { label: DOCUMENT_STATUS_LABELS.in_review, bg: 'bg-info-100', color: 'text-info-800' },
  [DOCUMENT_STATUS.INCOMPLETE]: { label: DOCUMENT_STATUS_LABELS.incomplete, bg: 'bg-error-100', color: 'text-error-800' },
  [DOCUMENT_STATUS.REJECTED]: { label: DOCUMENT_STATUS_LABELS.rejected, bg: 'bg-error-100', color: 'text-error-800' },
  [DOCUMENT_STATUS.PENDING]: { label: DOCUMENT_STATUS_LABELS.pending, bg: 'bg-neutral-100', color: 'text-neutral-800' },
};

export function getDocumentStatusBadge(status: string): DocumentStatusBadge {
  return DOCUMENT_STATUS_BADGES[status] ?? {
    label: status,
    bg: 'bg-neutral-100',
    color: 'text-neutral-800',
  };
}
