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
