import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { refunds, paymentTransactions, paymentProviders, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { validateBody, RefundActionSchema } from '@/lib/schemas'
import { REFUND_STATUS } from '@/config/refund'
import { refundTransaction } from '@/lib/payments/payrexx-client'

const approvedByUser = alias(users, 'approved_by_user')
const requestedByUser = alias(users, 'requested_by_user')
const processedByUser = alias(users, 'processed_by_user')

// GET /api/admin/refunds/[id] - Get refund details
export const GET = withAdmin<{ id: string }>('finanzen', async (request, session, context) => {
  const { id: refundId } = context!.params!
  try {
    const [refund] = await db
      .select({
        id: refunds.id,
        refundNumber: refunds.refundNumber,
        originalTransactionId: refunds.originalTransactionId,
        refundTransactionId: refunds.refundTransactionId,
        amountCents: refunds.amountCents,
        currency: refunds.currency,
        reason: refunds.reason,
        reasonDetails: refunds.reasonDetails,
        status: refunds.status,
        requestedBy: refunds.requestedBy,
        approvedBy: refunds.approvedBy,
        processedBy: refunds.processedBy,
        customerNotes: refunds.customerNotes,
        internalNotes: refunds.internalNotes,
        createdAt: refunds.createdAt,
        approvedAt: refunds.approvedAt,
        processedAt: refunds.processedAt,
        customer_name: users.name,
        customer_email: users.email,
        original_amount: sql<number>`${paymentTransactions.amountCents} / 100.0`,
        provider_transaction_id: paymentTransactions.providerTransactionId,
        transaction_currency: paymentTransactions.currency,
        refund_amount: sql<number>`ROUND(${refunds.amountCents} / 100.0, 2)`,
        approved_by_name: approvedByUser.name,
        requested_by_name: requestedByUser.name,
        processed_by_name: processedByUser.name,
      })
      .from(refunds)
      .innerJoin(users, eq(refunds.requestedBy, users.id))
      .innerJoin(paymentTransactions, eq(refunds.originalTransactionId, paymentTransactions.id))
      .leftJoin(approvedByUser, eq(refunds.approvedBy, approvedByUser.id))
      .leftJoin(requestedByUser, eq(refunds.requestedBy, requestedByUser.id))
      .leftJoin(processedByUser, eq(refunds.processedBy, processedByUser.id))
      .where(eq(refunds.id, refundId))

    if (!refund) {
      return apiNotFound('Refund not found')
    }

    return apiSuccess({ refund })

  } catch (error) {
    logger.error('Get admin refund error', { error })
    return apiError(error, 'Failed to retrieve refund')
  }
})

// PUT /api/admin/refunds/[id] - Approve/reject/process refund
export const PUT = withAdmin<{ id: string }>('finanzen', async (request, session, context) => {
  const { id: refundId } = context!.params!
  try {
    const body = await request.json()
    const validation = validateBody(RefundActionSchema, body)
    if (!validation.success) return validation.error
    const { action, notes } = validation.data

    // Get refund details with provider info
    const [refund] = await db
      .select({
        id: refunds.id,
        status: refunds.status,
        amountCents: refunds.amountCents,
        reason: refunds.reason,
        requestedBy: refunds.requestedBy,
        refundNumber: refunds.refundNumber,
        originalTransactionId: refunds.originalTransactionId,
        provider_transaction_id: paymentTransactions.providerTransactionId,
        currency: paymentTransactions.currency,
        provider_id: paymentTransactions.providerId,
        provider_slug: paymentProviders.slug,
      })
      .from(refunds)
      .innerJoin(paymentTransactions, eq(refunds.originalTransactionId, paymentTransactions.id))
      .innerJoin(paymentProviders, eq(paymentTransactions.providerId, paymentProviders.id))
      .where(eq(refunds.id, refundId))

    if (!refund) {
      return apiNotFound('Refund not found')
    }

    if (action === 'approve') {
      if (refund.status !== REFUND_STATUS.REQUESTED) {
        return apiBadRequest('Refund is not in requested status')
      }

      await db
        .update(refunds)
        .set({
          status: REFUND_STATUS.APPROVED,
          approvedBy: session.user.id,
          approvedAt: sql`CURRENT_TIMESTAMP`,
          internalNotes: notes
            ? sql`COALESCE(${refunds.internalNotes}, '') || ${`\n[${new Date().toISOString()}] Approved by admin: ${notes}`}`
            : refunds.internalNotes,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(refunds.id, refundId))

    } else if (action === 'reject') {
      if (refund.status !== REFUND_STATUS.REQUESTED && refund.status !== REFUND_STATUS.APPROVED) {
        return apiBadRequest('Refund cannot be rejected in current status')
      }

      await db
        .update(refunds)
        .set({
          status: REFUND_STATUS.REJECTED,
          processedBy: session.user.id,
          processedAt: sql`CURRENT_TIMESTAMP`,
          internalNotes: notes
            ? sql`COALESCE(${refunds.internalNotes}, '') || ${`\n[${new Date().toISOString()}] Rejected by admin: ${notes}`}`
            : refunds.internalNotes,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(refunds.id, refundId))

    } else if (action === 'process') {
      if (refund.status !== REFUND_STATUS.APPROVED) {
        return apiBadRequest('Refund must be approved before processing')
      }

      try {
        const payrexxRefund = await refundTransaction(
          refund.provider_transaction_id!,
          Number(refund.amountCents)
        )

        // Update refund with Payrexx refund details
        await db
          .update(refunds)
          .set({
            refundTransactionId: String(payrexxRefund.id),
            status: REFUND_STATUS.PROCESSING,
            processedBy: session.user.id,
            processedAt: sql`CURRENT_TIMESTAMP`,
            approvedAt: sql`CURRENT_TIMESTAMP`,
            approvedBy: session.user.id,
            internalNotes: sql`COALESCE(${refunds.internalNotes}, '') || ${`\n[${new Date().toISOString()}] Processed via Payrexx: ${payrexxRefund.id}`}`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(refunds.id, refundId))

        // Create refund transaction record
        await db
          .insert(paymentTransactions)
          .values({
            userId: refund.requestedBy,
            providerId: refund.provider_id,
            providerTransactionId: String(payrexxRefund.id),
            type: 'refund',
            status: REFUND_STATUS.PROCESSING,
            amountCents: Number(refund.amountCents),
            currency: refund.currency,
            description: `Refund for transaction ${refund.provider_transaction_id}`,
          })

      } catch (refundError: unknown) {
        logger.error('Payrexx refund processing error', { error: refundError })
        const errorMessage = refundError instanceof Error ? refundError.message : 'Unknown refund error'

        await db
          .update(refunds)
          .set({
            status: REFUND_STATUS.REJECTED,
            processedBy: session.user.id,
            processedAt: sql`CURRENT_TIMESTAMP`,
            internalNotes: sql`COALESCE(${refunds.internalNotes}, '') || ${`\n[${new Date().toISOString()}] Processing failed: ${errorMessage}`}`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(refunds.id, refundId))

        return apiError(refundError, 'Refund processing failed')
      }
    }

    // Get updated refund
    const [updated] = await db
      .select({
        id: refunds.id,
        refundNumber: refunds.refundNumber,
        status: refunds.status,
        amountCents: refunds.amountCents,
        currency: refunds.currency,
        reason: refunds.reason,
        internalNotes: refunds.internalNotes,
        createdAt: refunds.createdAt,
        approvedAt: refunds.approvedAt,
        processedAt: refunds.processedAt,
        customer_name: users.name,
        customer_email: users.email,
      })
      .from(refunds)
      .innerJoin(users, eq(refunds.requestedBy, users.id))
      .where(eq(refunds.id, refundId))

    return apiSuccess({
      refund: updated,
      message: `Refund ${action}d successfully`
    })

  } catch (error) {
    logger.error('Admin refund action error', { error })
    return apiError(error, 'Failed to process refund action')
  }
})
