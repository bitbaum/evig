/**
 * Refund Configuration
 *
 * SSOT for refund status labels and reason text.
 * Used by: RefundManager, refund API routes
 */

export const REFUND_STATUS = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
} as const

export type RefundStatus = typeof REFUND_STATUS[keyof typeof REFUND_STATUS]

export const REFUND_STATUS_LABELS: Record<string, string> = {
  [REFUND_STATUS.REQUESTED]: 'Angefragt',
  [REFUND_STATUS.APPROVED]: 'Genehmigt',
  [REFUND_STATUS.PROCESSING]: 'In Bearbeitung',
  [REFUND_STATUS.COMPLETED]: 'Abgeschlossen',
  [REFUND_STATUS.REJECTED]: 'Abgelehnt',
}

export const REFUND_REASON = {
  CUSTOMER_REQUEST: 'customer_request',
  SERVICE_CANCELLED: 'service_cancelled',
  SERVICE_NOT_COMPLETED: 'service_not_completed',
  DUPLICATE_CHARGE: 'duplicate_charge',
  FRAUD: 'fraud',
  OTHER: 'other',
} as const

export type RefundReason = typeof REFUND_REASON[keyof typeof REFUND_REASON]

export const REFUND_REASON_LABELS: Record<string, string> = {
  [REFUND_REASON.CUSTOMER_REQUEST]: 'Kundenwunsch',
  [REFUND_REASON.SERVICE_CANCELLED]: 'Service storniert',
  [REFUND_REASON.SERVICE_NOT_COMPLETED]: 'Service nicht erbracht',
  [REFUND_REASON.DUPLICATE_CHARGE]: 'Doppelte Belastung',
  [REFUND_REASON.FRAUD]: 'Betrug',
  [REFUND_REASON.OTHER]: 'Sonstiges',
}

export function getRefundStatusLabel(status: string): string {
  return REFUND_STATUS_LABELS[status] ?? status
}

export function getRefundReasonLabel(reason: string): string {
  return REFUND_REASON_LABELS[reason] ?? reason
}
