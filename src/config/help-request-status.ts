/**
 * Team Help Request Status Constants (SSOT)
 * Used for internal team help request management.
 */

export const HELP_REQUEST_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
} as const;

export type HelpRequestStatus = typeof HELP_REQUEST_STATUS[keyof typeof HELP_REQUEST_STATUS];
