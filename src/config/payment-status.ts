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

/**
 * Payment transaction types (payment_transactions.type column).
 * CHECK (type IN ('payment', 'refund', 'chargeback', 'payout', 'fee', 'transfer'))
 */
export const PAYMENT_TRANSACTION_TYPE = {
  PAYMENT: 'payment',
  REFUND: 'refund',
  CHARGEBACK: 'chargeback',
  PAYOUT: 'payout',
  FEE: 'fee',
  TRANSFER: 'transfer',
} as const;

export type PaymentTransactionType = typeof PAYMENT_TRANSACTION_TYPE[keyof typeof PAYMENT_TRANSACTION_TYPE];

/**
 * Payment dispute status (payment_disputes.status column).
 * CHECK (status IN ('opened', 'under_review', 'won', 'lost', 'cancelled'))
 */
export const PAYMENT_DISPUTE_STATUS = {
  OPENED: 'opened',
  UNDER_REVIEW: 'under_review',
  WON: 'won',
  LOST: 'lost',
  CANCELLED: 'cancelled',
} as const;

export type PaymentDisputeStatus = typeof PAYMENT_DISPUTE_STATUS[keyof typeof PAYMENT_DISPUTE_STATUS];

export const ESCROW_STATUS = {
  ACTIVE: 'active',
  RELEASED: 'released',
} as const;

export type EscrowStatus = typeof ESCROW_STATUS[keyof typeof ESCROW_STATUS];
