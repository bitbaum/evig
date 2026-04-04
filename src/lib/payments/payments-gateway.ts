/**
 * Payment Gateway Operations
 *
 * Database operations for payment providers and transactions.
 * Handles provider lookup, transaction creation, and transaction updates.
 */

import { db } from '@/db'
import { paymentProviders, paymentTransactions } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { PAYMENT_STATUS } from '@/config/payment-status'
import { logger } from '@/lib/logger'
import type { SupportedCurrency } from '@/lib/payments/currency'
import type { PaymentProvider } from './payments-fees'

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_PAYMENT_PROVIDER = 'payrexx'

// ============================================================================
// Types
// ============================================================================

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
      status: PAYMENT_STATUS.PENDING,
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

/**
 * Update a transaction with the external gateway ID
 */
export async function updateTransactionGatewayId(
  transactionId: string,
  gatewayId: number
): Promise<void> {
  await db
    .update(paymentTransactions)
    .set({ providerTransactionId: String(gatewayId) })
    .where(eq(paymentTransactions.id, transactionId))
}
