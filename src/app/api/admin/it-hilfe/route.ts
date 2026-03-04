import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { CountRow } from '@/lib/api/db-types'

// GET /api/admin/it-hilfe - List all IT-Hilfe requests with filters
export const GET = withAdmin('it-hilfe-admin', async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const category = searchParams.get('category') || 'all'
    const urgency = searchParams.get('urgency') || 'all'
    const canton = searchParams.get('canton')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (status !== 'all') {
      conditions.push(`r.status = $${conditions.length + 1}`)
      params.push(status)
    }

    if (category !== 'all') {
      conditions.push(`r.category_id = $${conditions.length + 1}`)
      params.push(category)
    }

    if (urgency !== 'all') {
      conditions.push(`r.urgency = $${conditions.length + 1}`)
      params.push(urgency)
    }

    if (canton) {
      conditions.push(`r.canton = $${conditions.length + 1}`)
      params.push(canton)
    }

    if (search) {
      conditions.push(`(r.title ILIKE $${conditions.length + 1} OR r.description ILIKE $${conditions.length + 1} OR u.name ILIKE $${conditions.length + 1})`)
      params.push(`%${search}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const requestsQuery = `
      SELECT
        r.id, r.title, r.category_id, r.urgency, r.status,
        r.postal_code, r.city, r.canton, r.budget_amount_cents,
        r.budget_type, r.offer_count, r.admin_notes,
        r.created_at, r.updated_at,
        u.name as requester_name, u.email as requester_email
      FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} r
      JOIN ${TABLE_NAMES.USERS} u ON r.requester_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    params.push(limit, offset)
    const requests = await query(requestsQuery, params)

    const countParams = params.slice(0, -2)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} r
      JOIN ${TABLE_NAMES.USERS} u ON r.requester_id = u.id
      ${whereClause}
    `
    const countResult = await query(countQuery, countParams)
    const count = countResult.rows[0] as CountRow

    return apiSuccess({
      items: requests.rows,
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
