import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'

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

// GET /api/admin/payments/dashboard - Get payment dashboard data
export const GET = withAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const periodRaw = searchParams.get('period') || '30' // days
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Validate and sanitize period to prevent SQL injection
    const period = Math.max(1, Math.min(365, parseInt(periodRaw, 10) || 30))

    // Calculate date range
    let dateFilter = ''
    const params: (string | number)[] = []
    let paramIndex = 1

    if (startDate && endDate) {
      dateFilter = `AND pt.created_at >= $${paramIndex} AND pt.created_at <= $${paramIndex + 1}`
      params.push(startDate, endDate)
      paramIndex += 2
    } else {
      // Use parameterized query for period - cast to integer for safety
      dateFilter = `AND pt.created_at >= CURRENT_DATE - INTERVAL '1 day' * $${paramIndex}`
      params.push(period)
      paramIndex++
    }

    // Get payment overview metrics
    const overviewResult = await query(`
      SELECT
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
        COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount_cents END), 0) as total_volume_cents,
        COALESCE(SUM(CASE WHEN status = 'succeeded' THEN fee_cents END), 0) as total_fees_cents,
        COALESCE(SUM(CASE WHEN type = 'refund' AND status IN ('succeeded', 'completed') THEN amount_cents END), 0) as total_refunds_cents,
        ROUND(
          AVG(CASE WHEN status = 'succeeded' THEN EXTRACT(EPOCH FROM (processed_at - created_at)) END) / 60,
          2
        ) as avg_processing_time_minutes
      FROM ${TABLE_NAMES.PAYMENT_TRANSACTIONS} pt
      WHERE 1=1 ${dateFilter}
    `, params)

    const overview = overviewResult.rows[0] as OverviewRow

    // Get transactions by currency
    const currencyResult = await query(`
      SELECT
        currency,
        COUNT(*) as transaction_count,
        COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount_cents END), 0) as volume_cents
      FROM ${TABLE_NAMES.PAYMENT_TRANSACTIONS} pt
      WHERE status = 'succeeded' ${dateFilter.replace('pt.', '')}
      GROUP BY currency
      ORDER BY volume_cents DESC
    `, params)

    // Get transactions by payment method/provider
    const providerResult = await query(`
      SELECT
        pp.name as provider_name,
        COUNT(*) as transaction_count,
        COALESCE(SUM(CASE WHEN pt.status = 'succeeded' THEN pt.amount_cents END), 0) as volume_cents,
        ROUND(
          AVG(CASE WHEN pt.status = 'succeeded' THEN pt.fee_cents END),
          2
        ) as avg_fee_cents
      FROM ${TABLE_NAMES.PAYMENT_TRANSACTIONS} pt
      JOIN ${TABLE_NAMES.PAYMENT_PROVIDERS} pp ON pt.provider_id = pp.id
      WHERE 1=1 ${dateFilter}
      GROUP BY pp.id, pp.name
      ORDER BY volume_cents DESC
    `, params)

    // Get daily transaction volume (last 30 days)
    const dailyVolumeResult = await query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as transaction_count,
        COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount_cents END), 0) as volume_cents
      FROM ${TABLE_NAMES.PAYMENT_TRANSACTIONS} pt
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `)

    // Get recent transactions
    const recentTransactionsResult = await query(`
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
      FROM ${TABLE_NAMES.PAYMENT_TRANSACTIONS} pt
      JOIN ${TABLE_NAMES.USERS} u ON pt.user_id = u.id
      JOIN ${TABLE_NAMES.PAYMENT_PROVIDERS} pp ON pt.provider_id = pp.id
      ORDER BY pt.created_at DESC
      LIMIT 10
    `)

    // Get escrow overview
    const escrowResult = await query(`
      SELECT
        COUNT(*) as total_escrows,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_escrows,
        COUNT(CASE WHEN status = 'released' THEN 1 END) as released_escrows,
        COALESCE(SUM(total_amount_cents), 0) as total_escrow_amount_cents,
        COALESCE(SUM(released_amount_cents), 0) as total_released_amount_cents
      FROM ${TABLE_NAMES.ESCROW_ACCOUNTS} ea
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `)

    // Get refund overview
    const refundResult = await query(`
      SELECT
        COUNT(*) as total_refunds,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_refunds,
        COUNT(CASE WHEN status = 'requested' THEN 1 END) as pending_refunds,
        COALESCE(SUM(CASE WHEN status IN ('completed', 'processing') THEN amount_cents END), 0) as total_refund_amount_cents
      FROM ${TABLE_NAMES.REFUNDS} r
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `)

    // Get dispute overview
    const disputeResult = await query(`
      SELECT
        COUNT(*) as total_disputes,
        COUNT(CASE WHEN status = 'opened' THEN 1 END) as open_disputes,
        COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_disputes,
        COALESCE(SUM(amount_cents), 0) as total_dispute_amount_cents
      FROM ${TABLE_NAMES.PAYMENT_DISPUTES} pd
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `)

    // Calculate key metrics
    const successRate = overview.total_transactions > 0
      ? (overview.successful_transactions / overview.total_transactions * 100).toFixed(2)
      : '0.00'

    const netVolume = overview.total_volume_cents - overview.total_fees_cents - overview.total_refunds_cents

    const escrow = escrowResult.rows[0] as EscrowRow
    const refundSummary = refundResult.rows[0] as RefundSummaryRow
    const dispute = disputeResult.rows[0] as DisputeRow

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
      currencyBreakdown: (currencyResult.rows as CurrencyRow[]).map(row => ({
        currency: row.currency,
        transactions: parseInt(row.transaction_count),
        volume: Number(row.volume_cents) / 100
      })),
      providerBreakdown: (providerResult.rows as ProviderRow[]).map(row => ({
        provider: row.provider_name,
        transactions: parseInt(row.transaction_count),
        volume: Number(row.volume_cents) / 100,
        avgFee: Number(row.avg_fee_cents) / 100
      })),
      dailyVolume: (dailyVolumeResult.rows as DailyRow[]).map(row => ({
        date: row.date,
        transactions: parseInt(row.transaction_count),
        volume: Number(row.volume_cents) / 100
      })),
      recentTransactions: (recentTransactionsResult.rows as TransactionRow[]).map(row => ({
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