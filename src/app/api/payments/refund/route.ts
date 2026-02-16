import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/auth'
import { requireStripeClient } from '@/lib/payments/stripe-client'
import { query, transaction } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { validateBody, RefundSchema } from '@/lib/schemas'

interface TransactionRow {
  id: string
  user_id: string
  provider_id: string
  provider_transaction_id: string
  amount_cents: number
  currency: string
  provider_slug: string
  user_name: string
  user_email: string
}

interface RefundTotalRow {
  total_refunded: number
}

interface RefundCreatedRow {
  id: string
  refund_number: string
}

export async function POST(request: NextRequest) {
  // Initialize Stripe lazily inside handler to avoid build-time errors
  const stripe = requireStripeClient()

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Authentifizierung erforderlich')
    }

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

    // Get transaction details
    const transactionResult = await query(`
      SELECT
        pt.*,
        pp.slug as provider_slug,
        u.name as user_name,
        u.email as user_email
      FROM ${TABLE_NAMES.PAYMENT_TRANSACTIONS} pt
      JOIN ${TABLE_NAMES.PAYMENT_PROVIDERS} pp ON pt.provider_id = pp.id
      JOIN ${TABLE_NAMES.USERS} u ON pt.user_id = u.id
      WHERE pt.id = $1 AND pt.status = 'succeeded'
    `, [transactionId])

    if (transactionResult.rows.length === 0) {
      return apiNotFound('Transaktion nicht gefunden oder nicht erstattungsfähig')
    }

    const txn = transactionResult.rows[0] as TransactionRow

    // Check if user owns the transaction or is admin
    const isAdmin = session.user.isStaff

    if (txn.user_id !== session.user.id && !isAdmin) {
      return apiUnauthorized('Sie können nur eigene Transaktionen erstatten')
    }

    const refundAmountCents = Math.round(amount * 100)

    if (refundAmountCents > txn.amount_cents) {
      return apiBadRequest('Erstattungsbetrag darf den ursprünglichen Transaktionsbetrag nicht übersteigen')
    }

    // Check for existing refunds on this transaction
    const existingRefundsResult = await query(`
      SELECT COALESCE(SUM(amount_cents), 0) as total_refunded
      FROM ${TABLE_NAMES.REFUNDS}
      WHERE original_transaction_id = $1 AND status IN ('approved', 'processing', 'completed')
    `, [transactionId])

    const refundTotals = existingRefundsResult.rows[0] as RefundTotalRow
    const totalRefunded = refundTotals.total_refunded
    const remainingAmount = txn.amount_cents - totalRefunded

    if (refundAmountCents > remainingAmount) {
      return apiBadRequest(`Erstattungsbetrag übersteigt das verbleibende Guthaben. Maximal erstattbar: ${(remainingAmount / 100).toFixed(2)} ${txn.currency}`)
    }

    // Create refund record
    const refundResult = await query(`
      INSERT INTO ${TABLE_NAMES.REFUNDS} (
        refund_number,
        original_transaction_id,
        amount_cents,
        currency,
        reason,
        reason_details,
        requested_by,
        customer_notes,
        status
      ) VALUES (
        generate_refund_number(),
        $1, $2, $3, $4, $5, $6, $7, $8
      )
      RETURNING id, refund_number
    `, [
      transactionId,
      refundAmountCents,
      txn.currency,
      reason,
      reasonDetails || null,
      session.user.id,
      customerNotes || null,
      isAdmin ? 'approved' : 'requested'
    ])

    const refund = refundResult.rows[0] as RefundCreatedRow
    const refundId = refund.id
    const refundNumber = refund.refund_number

    // If admin requested, process immediately
    if (isAdmin) {
      try {
        // Process refund with Stripe
        const stripeRefund = await stripe.refunds.create({
          payment_intent: txn.provider_transaction_id,
          amount: refundAmountCents,
          reason: mapRefundReason(reason),
          metadata: {
            refundId: refundId.toString(),
            refundNumber,
            originalTransactionId: transactionId,
          }
        })

        // Wrap refund record update + transaction insert in DB transaction
        await transaction(async (client) => {
          // Update refund with Stripe refund ID
          await client.query(`
            UPDATE ${TABLE_NAMES.REFUNDS}
            SET
              refund_transaction_id = $1,
              status = 'processing',
              processed_by = $2,
              processed_at = CURRENT_TIMESTAMP,
              approved_at = CURRENT_TIMESTAMP,
              approved_by = $2
            WHERE id = $3
          `, [stripeRefund.id, session.user.id, refundId])

          // Create refund transaction record
          await client.query(`
            INSERT INTO ${TABLE_NAMES.PAYMENT_TRANSACTIONS} (
              user_id,
              provider_id,
              provider_transaction_id,
              type,
              status,
              amount_cents,
              currency,
              description,
              provider_response
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9
            )
          `, [
            txn.user_id,
            txn.provider_id,
            stripeRefund.id,
            'refund',
            'processing',
            refundAmountCents,
            txn.currency,
            `Refund for transaction ${txn.provider_transaction_id}`,
            JSON.stringify(stripeRefund)
          ])
        })

      } catch (stripeError: unknown) {
        logger.error('Stripe refund error', { error: stripeError })
        const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'

        // Mark refund as rejected
        await query(`
          UPDATE ${TABLE_NAMES.REFUNDS}
          SET
            status = 'rejected',
            processed_at = CURRENT_TIMESTAMP,
            internal_notes = $1
          WHERE id = $2
        `, [errorMessage, refundId])

        return apiError(stripeError, 'Erstattung konnte nicht verarbeitet werden')
      }
    }

    return apiSuccess({
      refundId,
      refundNumber,
      status: isAdmin ? 'processing' : 'requested',
      message: isAdmin ? 'Erstattung erfolgreich verarbeitet' : 'Erstattungsantrag zur Genehmigung eingereicht'
    })
  } catch (error) {
    logger.error('Refund creation error', { error })
    return apiError(error, 'Erstattungsantrag konnte nicht erstellt werden')
  }
}

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