import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { withAuth } from '@/lib/api/middleware'
import { requireStripeClient } from '@/lib/payments/stripe-client'
import { db } from '@/db'
import { paymentTransactions, paymentProviders, refunds, users } from '@/db/schema'
import { eq, and, sql, inArray } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { PAYMENT_STATUS } from '@/config/payment-status'
import { REFUND_STATUS } from '@/config/refund'
import { logger } from '@/lib/logger'
import { validateBody, RefundSchema } from '@/lib/schemas'

export const POST = withAuth(async (request, session) => {
  // Initialize Stripe lazily inside handler to avoid build-time errors
  const stripe = requireStripeClient()

  try {
    const body = await request.json()
    const validation = validateBody(RefundSchema, body)
    if (!validation.success) return validation.error
    const {
      transactionId,
      amount,
      reason,
      reasonDetails,
      customerNotes
    } = validation.data

    // Get transaction details with provider and user info
    const transactionRows = await db
      .select({
        id: paymentTransactions.id,
        userId: paymentTransactions.userId,
        providerId: paymentTransactions.providerId,
        providerTransactionId: paymentTransactions.providerTransactionId,
        amountCents: paymentTransactions.amountCents,
        currency: paymentTransactions.currency,
        providerSlug: paymentProviders.slug,
        userName: users.name,
        userEmail: users.email,
      })
      .from(paymentTransactions)
      .innerJoin(paymentProviders, eq(paymentTransactions.providerId, paymentProviders.id))
      .innerJoin(users, eq(paymentTransactions.userId, users.id))
      .where(
        and(
          eq(paymentTransactions.id, transactionId),
          eq(paymentTransactions.status, PAYMENT_STATUS.SUCCEEDED)
        )
      )

    if (transactionRows.length === 0) {
      return apiNotFound('Transaktion nicht gefunden oder nicht erstattungsfähig')
    }

    const txn = transactionRows[0]

    // Check if user owns the transaction or is admin
    const isAdmin = session.user.isStaff

    if (txn.userId !== session.user.id && !isAdmin) {
      return apiUnauthorized('Sie können nur eigene Transaktionen erstatten')
    }

    const refundAmountCents = Math.round(amount * 100)

    if (refundAmountCents > txn.amountCents) {
      return apiBadRequest('Erstattungsbetrag darf den ursprünglichen Transaktionsbetrag nicht übersteigen')
    }

    // Check for existing refunds on this transaction
    const existingRefundsResult = await db
      .select({
        totalRefunded: sql<number>`COALESCE(SUM(${refunds.amountCents}), 0)`,
      })
      .from(refunds)
      .where(
        and(
          eq(refunds.originalTransactionId, transactionId),
          inArray(refunds.status, [REFUND_STATUS.APPROVED, REFUND_STATUS.PROCESSING, REFUND_STATUS.COMPLETED])
        )
      )

    const totalRefunded = Number(existingRefundsResult[0]?.totalRefunded ?? 0)
    const remainingAmount = txn.amountCents - totalRefunded

    if (refundAmountCents > remainingAmount) {
      return apiBadRequest(`Erstattungsbetrag übersteigt das verbleibende Guthaben. Maximal erstattbar: ${(remainingAmount / 100).toFixed(2)} ${txn.currency}`)
    }

    // Create refund record using database function for refund_number
    const [refundRow] = await db
      .insert(refunds)
      .values({
        refundNumber: sql`generate_refund_number()`,
        originalTransactionId: transactionId,
        amountCents: refundAmountCents,
        currency: txn.currency,
        reason,
        reasonDetails: reasonDetails || null,
        requestedBy: session.user.id,
        customerNotes: customerNotes || null,
        status: isAdmin ? REFUND_STATUS.APPROVED : REFUND_STATUS.REQUESTED,
      })
      .returning({ id: refunds.id, refundNumber: refunds.refundNumber })

    const refundId = refundRow.id
    const refundNumber = refundRow.refundNumber

    // If admin requested, process immediately
    if (isAdmin) {
      try {
        // Process refund with Stripe
        const stripeRefund = await stripe.refunds.create({
          payment_intent: txn.providerTransactionId!,
          amount: refundAmountCents,
          reason: mapRefundReason(reason),
          metadata: {
            refundId: refundId.toString(),
            refundNumber,
            originalTransactionId: transactionId,
          }
        })

        // Wrap refund record update + transaction insert in DB transaction
        await db.transaction(async (tx) => {
          // Update refund with Stripe refund ID
          await tx
            .update(refunds)
            .set({
              refundTransactionId: stripeRefund.id,
              status: REFUND_STATUS.PROCESSING,
              processedBy: session.user.id,
              processedAt: sql`CURRENT_TIMESTAMP`,
              approvedAt: sql`CURRENT_TIMESTAMP`,
              approvedBy: session.user.id,
            })
            .where(eq(refunds.id, refundId))

          // Create refund transaction record
          await tx
            .insert(paymentTransactions)
            .values({
              userId: txn.userId,
              providerId: txn.providerId,
              providerTransactionId: stripeRefund.id,
              type: 'refund',
              status: REFUND_STATUS.PROCESSING,
              amountCents: refundAmountCents,
              currency: txn.currency,
              description: `Refund for transaction ${txn.providerTransactionId}`,
              providerResponse: stripeRefund as unknown as Record<string, unknown>,
            })
        })

      } catch (stripeError: unknown) {
        logger.error('Stripe refund error', { error: stripeError })
        const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'

        // Mark refund as rejected
        await db
          .update(refunds)
          .set({
            status: REFUND_STATUS.REJECTED,
            processedAt: sql`CURRENT_TIMESTAMP`,
            internalNotes: errorMessage,
          })
          .where(eq(refunds.id, refundId))

        return apiError(stripeError, 'Erstattung konnte nicht verarbeitet werden')
      }
    }

    return apiSuccess({
      refundId,
      refundNumber,
      status: isAdmin ? REFUND_STATUS.PROCESSING : REFUND_STATUS.REQUESTED,
      message: isAdmin ? 'Erstattung erfolgreich verarbeitet' : 'Erstattungsantrag zur Genehmigung eingereicht'
    })
  } catch (error) {
    logger.error('Refund creation error', { error })
    return apiError(error, 'Erstattungsantrag konnte nicht erstellt werden')
  }
})

// Helper function to map our refund reasons to Stripe's format
function mapRefundReason(reason: string): Stripe.RefundCreateParams.Reason {
  switch (reason) {
    case 'customer_request':
      return 'requested_by_customer'
    case 'service_cancelled':
    case 'service_not_completed':
      return 'duplicate' // Stripe doesn't have a perfect match, using duplicate as closest
    case 'fraud':
      return 'fraudulent'
    default:
      return 'requested_by_customer'
  }
}
