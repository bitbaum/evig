/**
 * Normalized payment-gateway status vocabulary — SSOT.
 *
 * These are the provider-agnostic status strings every gateway adapter
 * (Payrexx, Taler, BTCPay) maps its native events onto, so the reconciliation
 * engine in `src/lib/services/payment-webhook.ts` speaks ONE vocabulary.
 *
 * The values are deliberately IDENTICAL to Payrexx's native transaction status
 * strings. Payrexx is the incumbent rail; keeping the normalized values equal to
 * its wire strings means the switch to a shared status enum is a pure rename with
 * ZERO behaviour change and ZERO data migration (stored order/transaction rows
 * already carry these exact strings).
 *
 * App-level enum → lives here + validated at the write boundary, NEVER as a SQL
 * CHECK constraint (per the repo rule: hand-synced CHECK lists drift).
 */
export const GATEWAY_STATUS = {
  /** Funds authorized / held (Payrexx reservation, Taler/BTCPay paid). */
  RESERVED: 'reserved',
  /** Captured / payment complete. */
  CONFIRMED: 'confirmed',
  /** Fully refunded. */
  REFUNDED: 'refunded',
  /** Partially refunded. */
  PARTIALLY_REFUNDED: 'partially-refunded',
  /** Awaiting bank/settlement confirmation. */
  WAITING: 'waiting',
  /** Transaction cancelled / reservation released. */
  CANCELLED: 'cancelled',
  /** Payment declined. */
  DECLINED: 'declined',
  /** Processing error. */
  ERROR: 'error',
} as const

export type GatewayStatus = typeof GATEWAY_STATUS[keyof typeof GATEWAY_STATUS]
