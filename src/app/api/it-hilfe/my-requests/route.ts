import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

interface RequestRow {
  id: string
  category_id: string
  device_brand: string | null
  device_model: string | null
  title: string
  description: string
  urgency: string
  budget_type: string
  budget_amount_cents: number | null
  postal_code: string
  city: string
  canton: string
  service_type: string
  skills_needed: string[] | null
  image_urls: string[] | null
  status: string
  matched_offer_id: string | null
  offer_count: number
  expires_at: string
  created_at: string
  updated_at: string
}

interface CountRow {
  total: string
}

/**
 * GET /api/it-hilfe/my-requests
 * Get current user's IT-Hilfe requests
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
    const conditions: string[] = ['requester_id = $1']
    const params: (string | number)[] = [session.user.id]
    let paramIndex = 2

    if (status) {
      conditions.push(`status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    // Query user's requests
    const requestsResult = await query(`
      SELECT *
      FROM ${TABLE_NAMES.IT_HILFE_REQUESTS}
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset])

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM ${TABLE_NAMES.IT_HILFE_REQUESTS}
      ${whereClause}
    `, params)

    const requests = (requestsResult.rows as RequestRow[]).map(row => ({
      id: row.id,
      categoryId: row.category_id,
      deviceBrand: row.device_brand,
      deviceModel: row.device_model,
      title: row.title,
      description: row.description,
      urgency: row.urgency,
      budgetType: row.budget_type,
      budgetAmountCents: row.budget_amount_cents,
      postalCode: row.postal_code,
      city: row.city,
      canton: row.canton,
      serviceType: row.service_type,
      skillsNeeded: row.skills_needed || [],
      imageUrls: row.image_urls || [],
      status: row.status,
      matchedOfferId: row.matched_offer_id,
      offerCount: row.offer_count,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    const countData = countResult.rows[0] as CountRow
    const total = parseInt(countData.total)

    logger.info('Fetched user IT-Hilfe requests', {
      userId: session.user.id,
      count: requests.length,
      total,
    })

    return apiSuccess({
      requests,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    logger.error('Error fetching user IT-Hilfe requests', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
