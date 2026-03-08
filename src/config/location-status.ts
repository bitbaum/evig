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
