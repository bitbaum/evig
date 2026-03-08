/**
 * Helper/Technician Status Constants (SSOT)
 * Used for IT-Hilfe helper profile management.
 */

export const HELPER_STATUS = {
  ACTIVE: 'active',
  VERIFIED: 'verified',
  SUSPENDED: 'suspended',
} as const;

export type HelperStatus = typeof HELPER_STATUS[keyof typeof HELPER_STATUS];

export const HELPER_STATUS_LABELS: Record<HelperStatus, string> = {
  active: 'Aktiv',
  verified: 'Verifiziert',
  suspended: 'Suspendiert',
};
