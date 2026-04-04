/**
 * Payment Flow Orchestrator
 *
 * High-level payment processing that coordinates fee calculation,
 * transaction creation, gateway integration, escrow, and invoicing.
 *
 * Re-exports all sub-module functions so existing consumers don't break.
 *
 * Used by:
 * - /api/appointments/book-with-payment
 * - /api/workshops/[slug]/register-with-payment
 * - /api/appointments/[id]/pay
 */

import { logger } from '@/lib/logger'
import { createGateway } from '@/lib/payments/payrexx-client'
import type { SupportedCurrency } from '@/lib/payments/currency'

// Re-export everything from sub-modules for backward compatibility
export { DEFAULT_CURRENCY, DEFAULT_AUTO_RELEASE_DAYS, calculateFees, calculateSwissVAT, centsToDisplay } from './payments-fees'
export type { PaymentProvider, FeeCalculation } from './payments-fees'

export { DEFAULT_PAYMENT_PROVIDER, getPaymentProvider, createTransaction, updateTransactionGatewayId } from './payments-gateway'
export type { TransactionParams, TransactionResult } from './payments-gateway'

export { createEscrowAccount } from './payments-escrow'
export type { EscrowParams } from './payments-escrow'

export { createInvoice, buildInvoiceLineItem } from './payments-invoice'
export type { InvoiceParams, InvoiceLineItem, InvoiceResult } from './payments-invoice'

// Import what we need for the orchestrator functions
import { DEFAULT_CURRENCY, DEFAULT_AUTO_RELEASE_DAYS, calculateFees } from './payments-fees'
import { getPaymentProvider, createTransaction, updateTransactionGatewayId } from './payments-gateway'
import { createEscrowAccount } from './payments-escrow'
import { createInvoice } from './payments-invoice'

// ============================================================================
// Types
// ============================================================================

export interface ProcessPaymentParams {
  userId: string
  baseAmountCents: number
  currency?: SupportedCurrency
  useEscrow: boolean
  autoReleaseDays?: number
  paymentDescription: string
  paymentMetadata: Record<string, string>
  // Payrexx redirect URLs
  successRedirectUrl: string
  failedRedirectUrl: string
  cancelRedirectUrl: string
  /** Purpose shown on payment page */
  purpose?: string
  // One of these contexts should be provided
  serviceAppointmentId?: string
  workshopRegistrationId?: string
  // Invoice details
  invoiceLineItems: import('./payments-invoice').InvoiceLineItem[]
  invoiceNotes: string
  invoicePaymentTerms: string
  // Additional transaction metadata
  transactionMetadata?: Record<string, unknown>
}

export interface ProcessPaymentResult {
  gatewayId: number
  paymentUrl: string
  transactionId: string
  invoiceId: string
  invoiceNumber: string
  totalAmountCents: number
  feeCents: number
  currency: SupportedCurrency
}

// ============================================================================
// High-Level Payment Flow
// ============================================================================

/**
 * Process a complete payment flow:
 * 1. Get payment provider
 * 2. Calculate fees
 * 3. Create payment transaction record (need ID as referenceId)
 * 4. Create Payrexx gateway
 * 5. Update transaction with gateway ID
 * 6. Create escrow account (if enabled)
 * 7. Create invoice
 */
export async function processPayment(
  params: ProcessPaymentParams
): Promise<ProcessPaymentResult> {
  const currency = params.currency || DEFAULT_CURRENCY
  const autoReleaseDays = params.autoReleaseDays || DEFAULT_AUTO_RELEASE_DAYS

  // 1. Get payment provider
  const provider = await getPaymentProvider()
  if (!provider) {
    throw new Error('Payment provider not available')
  }

  // 2. Calculate fees
  const fees = calculateFees(params.baseAmountCents, provider, currency)

  // 3. Create payment transaction record first (need ID as referenceId)
  const transaction = await createTransaction({
    userId: params.userId,
    providerId: provider.id,
    amountCents: fees.totalAmountCents,
    feeCents: fees.feeCents,
    netAmountCents: fees.baseAmountCents,
    currency,
    description: params.paymentDescription,
    useEscrow: params.useEscrow,
    autoReleaseDays,
    serviceAppointmentId: params.serviceAppointmentId,
    workshopRegistrationId: params.workshopRegistrationId,
    metadata: params.transactionMetadata
  })

  // 4. Create Payrexx gateway
  const gateway = await createGateway({
    amount: fees.totalAmountCents,
    currency,
    referenceId: transaction.transactionId,
    purpose: params.purpose || params.paymentDescription,
    successRedirectUrl: params.successRedirectUrl,
    failedRedirectUrl: params.failedRedirectUrl,
    cancelRedirectUrl: params.cancelRedirectUrl,
  })

  // 5. Update transaction with gateway ID
  await updateTransactionGatewayId(transaction.transactionId, gateway.id)

  // 6. Create escrow account if enabled
  if (params.useEscrow) {
    await createEscrowAccount({
      transactionId: transaction.transactionId,
      totalAmountCents: fees.totalAmountCents,
      currency,
      autoReleaseDays,
      buyerId: params.userId
    })
  }

  // 7. Create invoice
  const invoice = await createInvoice({
    userId: params.userId,
    baseAmountCents: fees.baseAmountCents,
    totalAmountCents: fees.totalAmountCents,
    currency,
    lineItems: params.invoiceLineItems,
    notes: params.invoiceNotes,
    paymentTerms: params.invoicePaymentTerms,
    serviceAppointmentId: params.serviceAppointmentId,
    workshopRegistrationId: params.workshopRegistrationId
  })

  logger.info('Payment flow completed', {
    gatewayId: gateway.id,
    transactionId: transaction.transactionId,
    invoiceId: invoice.invoiceId,
    totalAmount: fees.totalAmountCents,
    escrowEnabled: params.useEscrow
  })

  return {
    gatewayId: gateway.id,
    paymentUrl: gateway.link,
    transactionId: transaction.transactionId,
    invoiceId: invoice.invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    totalAmountCents: fees.totalAmountCents,
    feeCents: fees.feeCents,
    currency
  }
}

/**
 * Process payment without invoice creation
 * Used for scenarios like paying for existing appointments where invoice already exists
 */
export async function processPaymentWithoutInvoice(
  params: Omit<ProcessPaymentParams, 'invoiceLineItems' | 'invoiceNotes' | 'invoicePaymentTerms'>
): Promise<Omit<ProcessPaymentResult, 'invoiceId' | 'invoiceNumber'>> {
  const currency = params.currency || DEFAULT_CURRENCY
  const autoReleaseDays = params.autoReleaseDays || DEFAULT_AUTO_RELEASE_DAYS

  // 1. Get payment provider
  const provider = await getPaymentProvider()
  if (!provider) {
    throw new Error('Payment provider not available')
  }

  // 2. Calculate fees
  const fees = calculateFees(params.baseAmountCents, provider, currency)

  // 3. Create payment transaction record first (need ID as referenceId)
  const transaction = await createTransaction({
    userId: params.userId,
    providerId: provider.id,
    amountCents: fees.totalAmountCents,
    feeCents: fees.feeCents,
    netAmountCents: fees.baseAmountCents,
    currency,
    description: params.paymentDescription,
    useEscrow: params.useEscrow,
    autoReleaseDays,
    serviceAppointmentId: params.serviceAppointmentId,
    workshopRegistrationId: params.workshopRegistrationId,
    metadata: params.transactionMetadata
  })

  // 4. Create Payrexx gateway
  const gateway = await createGateway({
    amount: fees.totalAmountCents,
    currency,
    referenceId: transaction.transactionId,
    purpose: params.purpose || params.paymentDescription,
    successRedirectUrl: params.successRedirectUrl,
    failedRedirectUrl: params.failedRedirectUrl,
    cancelRedirectUrl: params.cancelRedirectUrl,
  })

  // 5. Update transaction with gateway ID
  await updateTransactionGatewayId(transaction.transactionId, gateway.id)

  // 6. Create escrow account if enabled
  if (params.useEscrow) {
    await createEscrowAccount({
      transactionId: transaction.transactionId,
      totalAmountCents: fees.totalAmountCents,
      currency,
      autoReleaseDays,
      buyerId: params.userId
    })
  }

  return {
    gatewayId: gateway.id,
    paymentUrl: gateway.link,
    transactionId: transaction.transactionId,
    totalAmountCents: fees.totalAmountCents,
    feeCents: fees.feeCents,
    currency
  }
}
