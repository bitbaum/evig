/**
 * Payment Status Constants (SSOT)
 * Used for payment processing and escrow operations.
 */

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  CONFIRMED: 'confirmed',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const ESCROW_STATUS = {
  ACTIVE: 'active',
  RELEASED: 'released',
} as const;

export type EscrowStatus = typeof ESCROW_STATUS[keyof typeof ESCROW_STATUS];
