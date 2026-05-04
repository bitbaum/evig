/**
 * Location Approval Status Constants (SSOT)
 */

export const LOCATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
} as const;

export type LocationStatus = typeof LOCATION_STATUS[keyof typeof LOCATION_STATUS];

export const LOCATION_STATUS_LABELS: Record<string, string> = {
  [LOCATION_STATUS.PENDING]: 'Ausstehend',
  [LOCATION_STATUS.APPROVED]: 'Genehmigt',
  [LOCATION_STATUS.REJECTED]: 'Abgelehnt',
  [LOCATION_STATUS.SUSPENDED]: 'Suspendiert',
};

export function getLocationStatusLabel(status: string): string {
  return LOCATION_STATUS_LABELS[status] || status;
}

export const LOCATION_STATUS_COLORS: Record<string, string> = {
  [LOCATION_STATUS.APPROVED]: 'bg-primary-100 text-primary-800',
  [LOCATION_STATUS.PENDING]: 'bg-warning-100 text-warning-800',
  [LOCATION_STATUS.REJECTED]: 'bg-error-100 text-error-800',
  [LOCATION_STATUS.SUSPENDED]: 'bg-orange-100 text-orange-800',
};
