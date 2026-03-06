import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { CountRow } from '@/lib/api/db-types'
import { validateQuery, AdminListingsQuerySchema } from '@/lib/schemas'

// GET /api/admin/marketplace - List all listings with admin filters
export const GET = withAdmin('marketplace', async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const validation = validateQuery(AdminListingsQuerySchema, Object.fromEntries(searchParams))
    if (!validation.success) return validation.error

    const { status, category, seller_type, verified, reported, search, limit, offset } = validation.data

    const conditions: string[] = []
    const params: (string | number | boolean)[] = []

    if (status !== 'all') {
      conditions.push(`l.status = $${conditions.length + 1}`)
      params.push(status)
    }

    if (category) {
      conditions.push(`l.category = $${conditions.length + 1}`)
      params.push(category)
    }

    if (seller_type === 'revampit') {
      conditions.push(`l.is_revampit = true`)
    } else if (seller_type === 'community') {
      conditions.push(`l.is_revampit = false`)
    }

    if (verified === 'yes') {
      conditions.push(`l.verified_at IS NOT NULL`)
    } else if (verified === 'no') {
      conditions.push(`l.verified_at IS NULL`)
    }

    if (reported === 'yes') {
      conditions.push(`EXISTS (SELECT 1 FROM ${TABLE_NAMES.LISTING_REPORTS} lr WHERE lr.listing_id = l.id AND lr.status = 'pending')`)
    }

    if (search) {
      conditions.push(`(l.title ILIKE $${conditions.length + 1} OR u.name ILIKE $${conditions.length + 1} OR u.email ILIKE $${conditions.length + 1})`)
      params.push(`%${search}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const listingsQuery = `
      SELECT
        l.id, l.title, l.price_chf, l.category, l.condition, l.status,
        l.is_revampit, l.verified_at, l.admin_notes, l.created_at,
        u.name as seller_name, u.email as seller_email,
        (SELECT COUNT(*) FROM ${TABLE_NAMES.LISTING_REPORTS} lr
         WHERE lr.listing_id = l.id AND lr.status = 'pending') as report_count
      FROM ${TABLE_NAMES.LISTINGS} l
      JOIN ${TABLE_NAMES.USERS} u ON l.seller_id = u.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    params.push(limit, offset)
    const listings = await query(listingsQuery, params)

    // Count query (same conditions, no limit/offset)
    const countParams = params.slice(0, -2)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${TABLE_NAMES.LISTINGS} l
      JOIN ${TABLE_NAMES.USERS} u ON l.seller_id = u.id
      ${whereClause}
    `
    const countResult = await query(countQuery, countParams)
    const count = countResult.rows[0] as CountRow

    return apiSuccess({
      items: listings.rows,
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
