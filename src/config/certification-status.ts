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
  [CERTIFICATION_STATUS.VERIFIED]: { label: CERTIFICATION_STATUS_LABELS.verified, bg: 'bg-green-100', color: 'text-green-800' },
  [CERTIFICATION_STATUS.REJECTED]: { label: CERTIFICATION_STATUS_LABELS.rejected, bg: 'bg-red-100', color: 'text-red-800' },
  [CERTIFICATION_STATUS.EXPIRED]: { label: CERTIFICATION_STATUS_LABELS.expired, bg: 'bg-orange-100', color: 'text-orange-800' },
  [CERTIFICATION_STATUS.PENDING]: { label: CERTIFICATION_STATUS_LABELS.pending, bg: 'bg-gray-100', color: 'text-gray-800' },
};

export function getCertificationStatusBadge(status: string): CertificationStatusBadge {
  return CERTIFICATION_STATUS_BADGES[status] ?? {
    label: status,
    bg: 'bg-gray-100',
    color: 'text-gray-800',
  };
}
