import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { refunds, paymentTransactions, users } from '@/db/schema'
import { eq, sql, desc } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { apiError, apiSuccess, parsePagination } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

const approvedByUser = alias(users, 'approved_by_user')
const requestedByUser = alias(users, 'requested_by_user')

// GET /api/admin/refunds - List all refunds for admin review
export const GET = withAdmin('finanzen', async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const { limit, offset } = parsePagination(request, { defaultLimit: 20 })

    const conditions = []
    if (status) {
      conditions.push(eq(refunds.status, status))
    }
    const where = conditions.length > 0 ? conditions[0] : undefined

    // Get refunds with related data + total count (parallel — independent queries)
    const [refundRows, [countRow]] = await Promise.all([
      db
        .select({
          id: refunds.id,
          refundNumber: refunds.refundNumber,
          originalTransactionId: refunds.originalTransactionId,
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
          transaction_currency: paymentTransactions.currency,
          refund_amount: sql<number>`ROUND(${refunds.amountCents} / 100.0, 2)`,
          approved_by_name: approvedByUser.name,
          requested_by_name: requestedByUser.name,
        })
        .from(refunds)
        .innerJoin(users, eq(refunds.requestedBy, users.id))
        .innerJoin(paymentTransactions, eq(refunds.originalTransactionId, paymentTransactions.id))
        .leftJoin(approvedByUser, eq(refunds.approvedBy, approvedByUser.id))
        .leftJoin(requestedByUser, eq(refunds.requestedBy, requestedByUser.id))
        .where(where)
        .orderBy(desc(refunds.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(refunds)
        .where(where),
    ])

    return apiSuccess({
      refunds: refundRows,
      total: countRow?.total ?? 0,
      limit,
      offset
    })

  } catch (error) {
    logger.error('List admin refunds error', { error })
    return apiError(error, 'Failed to retrieve refunds')
  }
})
