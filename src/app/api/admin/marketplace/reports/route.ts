import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { CountRow } from '@/lib/api/db-types'

// GET /api/admin/marketplace/reports - List all reports
export const GET = withAdmin('marketplace', async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (status !== 'all') {
      conditions.push(`lr.status = $${conditions.length + 1}`)
      params.push(status)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const reportsQuery = `
      SELECT
        lr.id, lr.reason, lr.details, lr.status, lr.created_at,
        lr.reviewed_at, lr.resolution_notes, lr.resolution_action,
        l.id as listing_id, l.title as listing_title, l.status as listing_status,
        ru.name as reporter_name, ru.email as reporter_email,
        su.name as seller_name, su.email as seller_email
      FROM ${TABLE_NAMES.LISTING_REPORTS} lr
      JOIN ${TABLE_NAMES.LISTINGS} l ON lr.listing_id = l.id
      JOIN ${TABLE_NAMES.USERS} ru ON lr.reporter_id = ru.id
      JOIN ${TABLE_NAMES.USERS} su ON l.seller_id = su.id
      ${whereClause}
      ORDER BY lr.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    params.push(limit, offset)
    const reports = await query(reportsQuery, params)

    const countParams = params.slice(0, -2)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${TABLE_NAMES.LISTING_REPORTS} lr
      ${whereClause}
    `
    const countResult = await query(countQuery, countParams)
    const count = countResult.rows[0] as CountRow

    return apiSuccess({
      items: reports.rows,
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
