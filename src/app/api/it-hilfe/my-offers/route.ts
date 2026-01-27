import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

interface OfferWithRequestRow {
  id: string
  request_id: string
  message: string
  estimated_time: string | null
  proposed_compensation: string | null
  relevant_skills: string[] | null
  status: string
  created_at: string
  // Request details
  request_title: string
  request_category_id: string
  request_device_brand: string | null
  request_device_model: string | null
  request_status: string
  request_city: string
  request_canton: string
  requester_name: string
}

interface CountRow {
  total: string
}

/**
 * GET /api/it-hilfe/my-offers
 * Get current user's submitted offers
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build WHERE conditions
    const conditions: string[] = ['o.helper_id = $1']
    const params: (string | number)[] = [session.user.id]
    let paramIndex = 2

    if (status) {
      conditions.push(`o.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    // Query user's offers with request details
    const offersResult = await query(`
      SELECT
        o.*,
        r.title as request_title,
        r.category_id as request_category_id,
        r.device_brand as request_device_brand,
        r.device_model as request_device_model,
        r.status as request_status,
        r.city as request_city,
        r.canton as request_canton,
        u.name as requester_name
      FROM ${TABLE_NAMES.IT_HILFE_OFFERS} o
      JOIN ${TABLE_NAMES.IT_HILFE_REQUESTS} r ON o.request_id = r.id
      JOIN ${TABLE_NAMES.USERS} u ON r.requester_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset])

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM ${TABLE_NAMES.IT_HILFE_OFFERS} o
      ${whereClause}
    `, params)

    const offers = (offersResult.rows as OfferWithRequestRow[]).map(row => ({
      id: row.id,
      requestId: row.request_id,
      message: row.message,
      estimatedTime: row.estimated_time,
      proposedCompensation: row.proposed_compensation,
      relevantSkills: row.relevant_skills || [],
      status: row.status,
      createdAt: row.created_at,
      request: {
        id: row.request_id,
        title: row.request_title,
        categoryId: row.request_category_id,
        deviceBrand: row.request_device_brand,
        deviceModel: row.request_device_model,
        status: row.request_status,
        city: row.request_city,
        canton: row.request_canton,
        requesterName: row.requester_name,
      },
    }))

    const countData = countResult.rows[0] as CountRow
    const total = parseInt(countData.total)

    logger.info('Fetched user IT-Hilfe offers', {
      userId: session.user.id,
      count: offers.length,
      total,
    })

    return apiSuccess({
      offers,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    logger.error('Error fetching user IT-Hilfe offers', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
