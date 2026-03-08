/**
 * Permission Request Status Constants (SSOT)
 * Used for admin permission requests.
 */

export const PERMISSION_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type PermissionRequestStatus = typeof PERMISSION_REQUEST_STATUS[keyof typeof PERMISSION_REQUEST_STATUS];
