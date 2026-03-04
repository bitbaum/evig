import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { CountRow } from '@/lib/api/db-types'

// GET /api/admin/refunds - List all refunds for admin review
export const GET = withAdmin('finanzen', async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereClause = 'WHERE 1=1'
    const params = []

    if (status) {
      whereClause += ` AND r.status = $${params.length + 1}`
      params.push(status)
    }

    // Get refunds with related data
    const refundsResult = await query(`
      SELECT
        r.*,
        u.name as customer_name,
        u.email as customer_email,
        pt.amount_cents / 100.0 as original_amount,
        pt.currency,
        ROUND(r.amount_cents / 100.0, 2) as refund_amount,
        ar.name as approved_by_name,
        rr.name as requested_by_name
      FROM ${TABLE_NAMES.REFUNDS} r
      JOIN ${TABLE_NAMES.USERS} u ON r.requested_by = u.id
      JOIN ${TABLE_NAMES.PAYMENT_TRANSACTIONS} pt ON r.original_transaction_id = pt.id
      LEFT JOIN ${TABLE_NAMES.USERS} ar ON r.approved_by = ar.id
      LEFT JOIN ${TABLE_NAMES.USERS} rr ON r.requested_by = rr.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset])

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM ${TABLE_NAMES.REFUNDS} r ${whereClause}
    `, params)

    const count = countResult.rows[0] as CountRow
    return apiSuccess({
      refunds: refundsResult.rows,
      total: parseInt(count.total),
      limit,
      offset
    })

  } catch (error) {
    logger.error('List admin refunds error', { error })
    return apiError(error, 'Failed to retrieve refunds')
  }
})