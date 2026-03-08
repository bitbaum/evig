/**
 * Protocol Status Constants (SSOT)
 * Used for meeting protocol lifecycle management.
 */

export const PROTOCOL_STATUS = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  REVIEW: 'review',
  FINALIZED: 'finalized',
} as const;

export type ProtocolStatus = typeof PROTOCOL_STATUS[keyof typeof PROTOCOL_STATUS];
