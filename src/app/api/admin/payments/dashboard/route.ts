import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql, getTableName, SQL } from 'drizzle-orm'
import { paymentTransactions, paymentProviders, escrowAccounts, refunds, paymentDisputes } from '@/db/schema/payments'
import { users } from '@/db/schema/auth'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { PAYMENT_STATUS, ESCROW_STATUS, PAYMENT_DISPUTE_STATUS } from '@/config/payment-status'
import { REFUND_STATUS } from '@/config/refund'

interface OverviewRow {
  total_transactions: number
  successful_transactions: number
  failed_transactions: number
  total_volume_cents: number
  total_fees_cents: number
  total_refunds_cents: number
  avg_processing_time_minutes: number | null
}

interface CurrencyRow {
  currency: string
  transaction_count: string
  volume_cents: number
}

interface ProviderRow {
  provider_name: string
  transaction_count: string
  volume_cents: number
  avg_fee_cents: number
}

interface DailyRow {
  date: string
  transaction_count: string
  volume_cents: number
}

interface TransactionRow {
  id: string
  provider_transaction_id: string
  type: string
  status: string
  amount: number
  currency: string
  created_at: string
  description: string
  customer_name: string
  provider_name: string
}

interface EscrowRow {
  total_escrows: string
  active_escrows: string
  released_escrows: string
  total_escrow_amount_cents: number
  total_released_amount_cents: number
}

interface RefundSummaryRow {
  total_refunds: string
  completed_refunds: string
  pending_refunds: string
  total_refund_amount_cents: number
}

interface DisputeRow {
  total_disputes: string
  open_disputes: string
  lost_disputes: string
  total_dispute_amount_cents: number
}

// Table name refs
const ptTable = getTableName(paymentTransactions)
const ppTable = getTableName(paymentProviders)
const uTable = getTableName(users)
const eaTable = getTableName(escrowAccounts)
const rTable = getTableName(refunds)
const pdTable = getTableName(paymentDisputes)

// GET /api/admin/payments/dashboard - Get payment dashboard data
export const GET = withAdmin('finanzen', async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const periodRaw = searchParams.get('period') || '30' // days
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Validate and sanitize period to prevent SQL injection
    const period = Math.max(1, Math.min(365, parseInt(periodRaw, 10) || 30))

    // Calculate date filter as SQL fragment
    let dateFilter: SQL
    if (startDate && endDate) {
      dateFilter = sql`AND pt.created_at >= ${startDate} AND pt.created_at <= ${endDate}`
    } else {
      dateFilter = sql`AND pt.created_at >= CURRENT_DATE - INTERVAL '1 day' * ${period}`
    }

    // Get payment overview metrics
    const overviewResult = await db.execute(sql`
      SELECT
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = ${PAYMENT_STATUS.SUCCEEDED} THEN 1 END) as successful_transactions,
        COUNT(CASE WHEN status = ${PAYMENT_STATUS.FAILED} THEN 1 END) as failed_transactions,
        COALESCE(SUM(CASE WHEN status = ${PAYMENT_STATUS.SUCCEEDED} THEN amount_cents END), 0) as total_volume_cents,
        COALESCE(SUM(CASE WHEN status = ${PAYMENT_STATUS.SUCCEEDED} THEN fee_cents END), 0) as total_fees_cents,
        COALESCE(SUM(CASE WHEN type = 'refund' AND status IN (${PAYMENT_STATUS.SUCCEEDED}, ${REFUND_STATUS.COMPLETED}) THEN amount_cents END), 0) as total_refunds_cents,
        ROUND(
          AVG(CASE WHEN status = ${PAYMENT_STATUS.SUCCEEDED} THEN EXTRACT(EPOCH FROM (processed_at - created_at)) END) / 60,
          2
        ) as avg_processing_time_minutes
      FROM ${sql.raw(ptTable)} pt
      WHERE 1=1 ${dateFilter}
    `)

    const overview = overviewResult.rows[0] as unknown as OverviewRow

    // Get transactions by currency
    const currencyResult = await db.execute(sql`
      SELECT
        currency,
        COUNT(*) as transaction_count,
        COALESCE(SUM(CASE WHEN status = ${PAYMENT_STATUS.SUCCEEDED} THEN amount_cents END), 0) as volume_cents
      FROM ${sql.raw(ptTable)} pt
      WHERE status = ${PAYMENT_STATUS.SUCCEEDED} ${dateFilter}
      GROUP BY currency
      ORDER BY volume_cents DESC
    `)

    // Get transactions by payment method/provider
    const providerResult = await db.execute(sql`
      SELECT
        pp.name as provider_name,
        COUNT(*) as transaction_count,
        COALESCE(SUM(CASE WHEN pt.status = ${PAYMENT_STATUS.SUCCEEDED} THEN pt.amount_cents END), 0) as volume_cents,
        ROUND(
          AVG(CASE WHEN pt.status = ${PAYMENT_STATUS.SUCCEEDED} THEN pt.fee_cents END),
          2
        ) as avg_fee_cents
      FROM ${sql.raw(ptTable)} pt
      JOIN ${sql.raw(ppTable)} pp ON pt.provider_id = pp.id
      WHERE 1=1 ${dateFilter}
      GROUP BY pp.id, pp.name
      ORDER BY volume_cents DESC
    `)

    // Get daily transaction volume (last 30 days)
    const dailyVolumeResult = await db.execute(sql`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as transaction_count,
        COALESCE(SUM(CASE WHEN status = ${PAYMENT_STATUS.SUCCEEDED} THEN amount_cents END), 0) as volume_cents
      FROM ${sql.raw(ptTable)} pt
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `)

    // Get recent transactions
    const recentTransactionsResult = await db.execute(sql`
      SELECT
        pt.id,
        pt.provider_transaction_id,
        pt.type,
        pt.status,
        pt.amount_cents / 100.0 as amount,
        pt.currency,
        pt.created_at,
        pt.description,
        u.name as customer_name,
        pp.name as provider_name
      FROM ${sql.raw(ptTable)} pt
      JOIN ${sql.raw(uTable)} u ON pt.user_id = u.id
      JOIN ${sql.raw(ppTable)} pp ON pt.provider_id = pp.id
      ORDER BY pt.created_at DESC
      LIMIT 10
    `)

    // Get escrow overview
    const escrowResult = await db.execute(sql`
      SELECT
        COUNT(*) as total_escrows,
        COUNT(CASE WHEN status = ${ESCROW_STATUS.ACTIVE} THEN 1 END) as active_escrows,
        COUNT(CASE WHEN status = ${ESCROW_STATUS.RELEASED} THEN 1 END) as released_escrows,
        COALESCE(SUM(total_amount_cents), 0) as total_escrow_amount_cents,
        COALESCE(SUM(released_amount_cents), 0) as total_released_amount_cents
      FROM ${sql.raw(eaTable)} ea
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `)

    // Get refund overview
    const refundResult = await db.execute(sql`
      SELECT
        COUNT(*) as total_refunds,
        COUNT(CASE WHEN status = ${REFUND_STATUS.COMPLETED} THEN 1 END) as completed_refunds,
        COUNT(CASE WHEN status = ${REFUND_STATUS.REQUESTED} THEN 1 END) as pending_refunds,
        COALESCE(SUM(CASE WHEN status IN (${REFUND_STATUS.COMPLETED}, ${REFUND_STATUS.PROCESSING}) THEN amount_cents END), 0) as total_refund_amount_cents
      FROM ${sql.raw(rTable)} r
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `)

    // Get dispute overview
    const disputeResult = await db.execute(sql`
      SELECT
        COUNT(*) as total_disputes,
        COUNT(CASE WHEN status = ${PAYMENT_DISPUTE_STATUS.OPENED} THEN 1 END) as open_disputes,
        COUNT(CASE WHEN status = ${PAYMENT_DISPUTE_STATUS.LOST} THEN 1 END) as lost_disputes,
        COALESCE(SUM(amount_cents), 0) as total_dispute_amount_cents
      FROM ${sql.raw(pdTable)} pd
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `)

    // Calculate key metrics
    const successRate = overview.total_transactions > 0
      ? (overview.successful_transactions / overview.total_transactions * 100).toFixed(2)
      : '0.00'

    const netVolume = overview.total_volume_cents - overview.total_fees_cents - overview.total_refunds_cents

    const escrow = escrowResult.rows[0] as unknown as EscrowRow
    const refundSummary = refundResult.rows[0] as unknown as RefundSummaryRow
    const dispute = disputeResult.rows[0] as unknown as DisputeRow

    return apiSuccess({
      overview: {
        totalTransactions: Number(overview.total_transactions),
        successfulTransactions: Number(overview.successful_transactions),
        failedTransactions: Number(overview.failed_transactions),
        successRate: `${successRate}%`,
        totalVolume: Number(overview.total_volume_cents) / 100,
        totalFees: Number(overview.total_fees_cents) / 100,
        totalRefunds: Number(overview.total_refunds_cents) / 100,
        netVolume: netVolume / 100,
        avgProcessingTime: overview.avg_processing_time_minutes || 0,
        currency: 'CHF' // Primary currency
      },
      currencyBreakdown: (currencyResult.rows as unknown as CurrencyRow[]).map(row => ({
        currency: row.currency,
        transactions: parseInt(row.transaction_count),
        volume: Number(row.volume_cents) / 100
      })),
      providerBreakdown: (providerResult.rows as unknown as ProviderRow[]).map(row => ({
        provider: row.provider_name,
        transactions: parseInt(row.transaction_count),
        volume: Number(row.volume_cents) / 100,
        avgFee: Number(row.avg_fee_cents) / 100
      })),
      dailyVolume: (dailyVolumeResult.rows as unknown as DailyRow[]).map(row => ({
        date: row.date,
        transactions: parseInt(row.transaction_count),
        volume: Number(row.volume_cents) / 100
      })),
      recentTransactions: (recentTransactionsResult.rows as unknown as TransactionRow[]).map(row => ({
        id: row.id,
        transactionId: row.provider_transaction_id,
        type: row.type,
        status: row.status,
        amount: row.amount,
        currency: row.currency,
        date: row.created_at,
        description: row.description,
        customer: row.customer_name,
        provider: row.provider_name
      })),
      escrow: {
        totalEscrows: parseInt(escrow.total_escrows),
        activeEscrows: parseInt(escrow.active_escrows),
        releasedEscrows: parseInt(escrow.released_escrows),
        totalEscrowAmount: Number(escrow.total_escrow_amount_cents) / 100,
        totalReleasedAmount: Number(escrow.total_released_amount_cents) / 100
      },
      refunds: {
        totalRefunds: parseInt(refundSummary.total_refunds),
        completedRefunds: parseInt(refundSummary.completed_refunds),
        pendingRefunds: parseInt(refundSummary.pending_refunds),
        totalRefundAmount: Number(refundSummary.total_refund_amount_cents) / 100
      },
      disputes: {
        totalDisputes: parseInt(dispute.total_disputes),
        openDisputes: parseInt(dispute.open_disputes),
        lostDisputes: parseInt(dispute.lost_disputes),
        totalDisputeAmount: Number(dispute.total_dispute_amount_cents) / 100
      }
    })

  } catch (error) {
    logger.error('Payment dashboard error', { error })
    return apiError(error, 'Failed to load payment dashboard data')
  }
})
