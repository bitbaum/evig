import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('active') !== 'false'

    let whereClause = activeOnly ? 'WHERE is_active = true' : ''
    const params: string[] = []

    if (category) {
      whereClause += whereClause ? ' AND' : 'WHERE'
      whereClause += ' category = $1'
      params.push(category)
    }

    const workshops = await query(`
      SELECT
        id,
        slug,
        title,
        description,
        category,
        duration,
        level,
        max_participants,
        price_cents,
        is_active,
        created_at
      FROM ${TABLE_NAMES.WORKSHOPS}
      ${whereClause}
      ORDER BY created_at DESC
    `, params)

    // Return array directly - consistent with /api/services pattern
    // Frontend accesses as: result.data (not result.data.workshops)
    return apiSuccess(workshops.rows)

  } catch (error) {
    // Handle database connection errors gracefully
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
      // Database not available - return empty array instead of error
      return apiSuccess({
        workshops: []
      })
    }
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}