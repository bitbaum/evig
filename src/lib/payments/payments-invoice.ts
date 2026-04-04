/**
 * Invoice Operations
 *
 * Database operations for creating invoices and
 * helper functions for building invoice line items.
 */

import { db } from '@/db'
import { invoices } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { SWISS_VAT_RATES } from '@/lib/payments/tax-compliance'
import { INVOICE_STATUS } from '@/config/invoice-status'
import { logger } from '@/lib/logger'
import type { SupportedCurrency } from '@/lib/payments/currency'
import { calculateSwissVAT } from './payments-fees'

// ============================================================================
// Types
// ============================================================================

export interface InvoiceParams {
  userId: string
  baseAmountCents: number
  totalAmountCents: number
  currency: SupportedCurrency
  lineItems: InvoiceLineItem[]
  notes: string
  paymentTerms: string
  // One of these should be provided
  serviceAppointmentId?: string
  workshopRegistrationId?: string
}

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: string
  total: string
}

export interface InvoiceResult {
  invoiceId: string
  invoiceNumber: string
}

// ============================================================================
// Invoice Operations
// ============================================================================

/**
 * Create an invoice for a payment
 */
export async function createInvoice(params: InvoiceParams): Promise<InvoiceResult> {
  const taxCents = calculateSwissVAT(params.baseAmountCents)

  const rows = await db
    .insert(invoices)
    .values({
      invoiceNumber: sql`generate_invoice_number()`,
      type: 'service',
      status: INVOICE_STATUS.DRAFT,
      userId: params.userId,
      serviceAppointmentId: params.serviceAppointmentId || null,
      workshopRegistrationId: params.workshopRegistrationId || null,
      subtotalCents: params.baseAmountCents,
      taxCents,
      totalCents: params.totalAmountCents,
      currency: params.currency,
      taxRate: String(SWISS_VAT_RATES.standard),
      lineItems: params.lineItems,
      issueDate: sql`CURRENT_DATE`,
      notes: params.notes,
      paymentTerms: params.paymentTerms,
    })
    .returning({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
    })

  const invoiceId = rows[0].id
  const invoiceNumber = rows[0].invoiceNumber

  logger.info('Invoice created', {
    invoiceId,
    invoiceNumber,
    userId: params.userId,
    amount: params.totalAmountCents
  })

  return { invoiceId, invoiceNumber }
}

/**
 * Helper to build invoice line items
 */
export function buildInvoiceLineItem(
  description: string,
  baseAmountCents: number,
  quantity: number = 1
): InvoiceLineItem {
  const unitPrice = (baseAmountCents / 100).toFixed(2)
  return {
    description,
    quantity,
    unitPrice,
    total: unitPrice
  }
}
