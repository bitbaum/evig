/**
 * Certification Status Constants (SSOT)
 * Used for technician/helper certification verification.
 */

export const CERTIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

export type CertificationStatus = typeof CERTIFICATION_STATUS[keyof typeof CERTIFICATION_STATUS];

export const CERTIFICATION_STATUS_LABELS: Record<CertificationStatus, string> = {
  pending: 'Ausstehend',
  verified: 'Verifiziert',
  rejected: 'Abgelehnt',
  expired: 'Abgelaufen',
};

export interface CertificationStatusBadge {
  label: string
  bg: string
  color: string
}

export const CERTIFICATION_STATUS_BADGES: Record<string, CertificationStatusBadge> = {
  [CERTIFICATION_STATUS.VERIFIED]: { label: CERTIFICATION_STATUS_LABELS.verified, bg: 'bg-primary-100', color: 'text-primary-800' },
  [CERTIFICATION_STATUS.REJECTED]: { label: CERTIFICATION_STATUS_LABELS.rejected, bg: 'bg-error-100', color: 'text-error-800' },
  [CERTIFICATION_STATUS.EXPIRED]: { label: CERTIFICATION_STATUS_LABELS.expired, bg: 'bg-orange-100', color: 'text-orange-800' },
  [CERTIFICATION_STATUS.PENDING]: { label: CERTIFICATION_STATUS_LABELS.pending, bg: 'bg-neutral-100', color: 'text-neutral-800' },
};

export function getCertificationStatusBadge(status: string): CertificationStatusBadge {
  return CERTIFICATION_STATUS_BADGES[status] ?? {
    label: status,
    bg: 'bg-neutral-100',
    color: 'text-neutral-800',
  };
}
