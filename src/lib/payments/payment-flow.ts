/**
 * Payment Flow Utility
 *
 * Consolidated payment processing logic for RevampIT.
 * Eliminates DRY violations across payment routes by providing
 * a single source of truth for payment operations.
 *
 * Uses Payrexx (redirect-based) for all payment processing.
 * In dev mode (no PAYREXX_INSTANCE env var), falls back to mock gateway.
 *
 * Used by:
 * - /api/appointments/book-with-payment
 * - /api/workshops/[slug]/register-with-payment
 * - /api/appointments/[id]/pay
 */

import { db } from '@/db'
import { paymentProviders, paymentTransactions, escrowAccounts, invoices } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { SWISS_VAT_RATES } from '@/lib/payments/tax-compliance'
import { logger } from '@/lib/logger'
import { createGateway } from '@/lib/payments/payrexx-client'
import type { SupportedCurrency } from '@/lib/payments/currency'

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_CURRENCY: SupportedCurrency = 'CHF'
export const DEFAULT_PAYMENT_PROVIDER = 'payrexx'
export const DEFAULT_AUTO_RELEASE_DAYS = 7

// ============================================================================
// Types
// ============================================================================

export interface PaymentProvider {
  id: string
  slug: string
  fee_percentage: number
  fee_fixed_cents: number
}

export interface FeeCalculation {
  baseAmountCents: number
  feeCents: number
  totalAmountCents: number
  currency: SupportedCurrency
}

export interface TransactionParams {
  userId: string
  providerId: string
  providerTransactionId?: string
  amountCents: number
  feeCents: number
  netAmountCents: number
  currency: SupportedCurrency
  description: string
  useEscrow: boolean
  autoReleaseDays: number
  // One of these should be provided
  serviceAppointmentId?: string
  workshopRegistrationId?: string
  metadata?: Record<string, unknown>
}

export interface TransactionResult {
  transactionId: string
}

export interface EscrowParams {
  transactionId: string
  totalAmountCents: number
  currency: SupportedCurrency
  autoReleaseDays: number
  buyerId: string
}

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
// Payment Provider Operations
// ============================================================================

/**
 * Fetch active payment provider by slug
 */
export async function getPaymentProvider(
  providerSlug: string = DEFAULT_PAYMENT_PROVIDER
): Promise<PaymentProvider | null> {
  const rows = await db
    .select({
      id: paymentProviders.id,
      slug: paymentProviders.slug,
      fee_percentage: paymentProviders.feePercentage,
      fee_fixed_cents: paymentProviders.feeFixedCents,
    })
    .from(paymentProviders)
    .where(
      and(
        eq(paymentProviders.slug, providerSlug),
        eq(paymentProviders.isActive, true),
      )
    )

  if (rows.length === 0) {
    logger.warn('Payment provider not found or inactive', { providerSlug })
    return null
  }

  const row = rows[0]
  return {
    id: row.id,
    slug: row.slug,
    fee_percentage: Number(row.fee_percentage ?? 0),
    fee_fixed_cents: row.fee_fixed_cents ?? 0,
  }
}

// ============================================================================
// Fee Calculations
// ============================================================================

/**
 * Calculate payment fees based on provider configuration
 */
export function calculateFees(
  baseAmountCents: number,
  provider: PaymentProvider,
  currency: SupportedCurrency = DEFAULT_CURRENCY
): FeeCalculation {
  const feeCents = Math.round(baseAmountCents * (provider.fee_percentage / 100)) + provider.fee_fixed_cents
  const totalAmountCents = baseAmountCents + feeCents

  return {
    baseAmountCents,
    feeCents,
    totalAmountCents,
    currency
  }
}

/**
 * Calculate VAT for Swiss transactions
 */
export function calculateSwissVAT(baseAmountCents: number): number {
  return Math.round(baseAmountCents * SWISS_VAT_RATES.standard)
}

// ============================================================================
// Transaction Operations
// ============================================================================

/**
 * Create a payment transaction record
 */
export async function createTransaction(
  params: TransactionParams
): Promise<TransactionResult> {
  const rows = await db
    .insert(paymentTransactions)
    .values({
      userId: params.userId,
      providerId: params.providerId,
      providerTransactionId: params.providerTransactionId || null,
      type: 'payment',
      status: 'pending',
      amountCents: params.amountCents,
      currency: params.currency,
      feeCents: params.feeCents,
      netAmountCents: params.netAmountCents,
      serviceAppointmentId: params.serviceAppointmentId || null,
      workshopRegistrationId: params.workshopRegistrationId || null,
      description: params.description,
      escrowReleaseDate: params.useEscrow
        ? sql`CURRENT_TIMESTAMP + INTERVAL '1 day' * ${params.autoReleaseDays}`
        : null,
      metadata: params.metadata ? params.metadata : {},
    })
    .returning({ id: paymentTransactions.id })

  const transactionId = rows[0].id

  logger.info('Payment transaction created', {
    transactionId,
    userId: params.userId,
    amount: params.amountCents,
    useEscrow: params.useEscrow
  })

  return { transactionId }
}

// ============================================================================
// Escrow Operations
// ============================================================================

/**
 * Create an escrow account for a transaction
 */
export async function createEscrowAccount(params: EscrowParams): Promise<void> {
  await db
    .insert(escrowAccounts)
    .values({
      transactionId: params.transactionId,
      totalAmountCents: params.totalAmountCents,
      currency: params.currency,
      autoReleaseDays: params.autoReleaseDays,
      releaseDeadline: sql`CURRENT_TIMESTAMP + INTERVAL '1 day' * ${params.autoReleaseDays}`,
      buyerId: params.buyerId,
      status: 'active',
    })

  logger.info('Escrow account created', {
    transactionId: params.transactionId,
    amount: params.totalAmountCents,
    autoReleaseDays: params.autoReleaseDays
  })
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
      status: 'draft',
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

// ============================================================================
// High-Level Payment Flow
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
  invoiceLineItems: InvoiceLineItem[]
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
  await db
    .update(paymentTransactions)
    .set({ providerTransactionId: String(gateway.id) })
    .where(eq(paymentTransactions.id, transaction.transactionId))

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
  await db
    .update(paymentTransactions)
    .set({ providerTransactionId: String(gateway.id) })
    .where(eq(paymentTransactions.id, transaction.transactionId))

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

/**
 * Convert cents to display amount
 */
export function centsToDisplay(cents: number): number {
  return cents / 100
}
