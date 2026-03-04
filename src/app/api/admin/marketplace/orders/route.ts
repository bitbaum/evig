import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { CountRow } from '@/lib/api/db-types'

// GET /api/admin/marketplace/orders - List all orders
export const GET = withAdmin('marketplace', async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (status !== 'all') {
      conditions.push(`o.status = $${conditions.length + 1}`)
      params.push(status)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const ordersQuery = `
      SELECT
        o.id, o.status, (o.amount_chf * 100)::int as total_cents, o.delivery_method,
        o.tracking_number, o.created_at, o.updated_at,
        l.id as listing_id, l.title as listing_title,
        bu.name as buyer_name, bu.email as buyer_email,
        su.name as seller_name, su.email as seller_email
      FROM ${TABLE_NAMES.MARKETPLACE_ORDERS} o
      JOIN ${TABLE_NAMES.LISTINGS} l ON o.listing_id = l.id
      JOIN ${TABLE_NAMES.USERS} bu ON o.buyer_id = bu.id
      JOIN ${TABLE_NAMES.USERS} su ON l.seller_id = su.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    params.push(limit, offset)
    const orders = await query(ordersQuery, params)

    const countParams = params.slice(0, -2)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${TABLE_NAMES.MARKETPLACE_ORDERS} o
      ${whereClause}
    `
    const countResult = await query(countQuery, countParams)
    const count = countResult.rows[0] as CountRow

    return apiSuccess({
      items: orders.rows,
      pagination: {
        total: parseInt(count.total),
        limit,
        offset,
        hasMore: offset + limit < parseInt(count.total),
      },
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
