/**
 * Invoice Status Configuration
 *
 * SSOT for invoice lifecycle statuses.
 * Used by: invoice API routes, invoice components
 */

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const

export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS]

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  [INVOICE_STATUS.DRAFT]: 'Entwurf',
  [INVOICE_STATUS.SENT]: 'Versendet',
  [INVOICE_STATUS.PAID]: 'Bezahlt',
  [INVOICE_STATUS.OVERDUE]: 'Überfällig',
  [INVOICE_STATUS.CANCELLED]: 'Storniert',
}

export function getInvoiceStatusLabel(status: string): string {
  return INVOICE_STATUS_LABELS[status] ?? status
}
