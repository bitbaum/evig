import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiForbidden } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'

interface WorkshopRow {
  id: string
  title: string
  slug: string
  category: string
  level: string
  max_participants: number
  price_cents: number
  is_active: boolean
  instance_count: string
}

// GET /api/admin/workshops/list - List all workshops for admin selection
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Authentication required')
    }

    // Check if user is staff (admin/super admin)
    // Using new simplified permission system (is_staff field)
    if (!session.user.isStaff) {
      return apiForbidden('Admin access required')
    }

    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const workshopsResult = await query(`
      SELECT
        w.*,
        COUNT(wi.id) as instance_count
      FROM ${TABLE_NAMES.WORKSHOPS} w
      LEFT JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON w.id = wi.workshop_id
      ${activeOnly ? 'WHERE w.is_active = true' : ''}
      GROUP BY w.id
      ORDER BY w.title ASC
    `, [])

    return apiSuccess({
      workshops: (workshopsResult.rows as WorkshopRow[]).map(w => ({
        ...w,
        instance_count: parseInt(w.instance_count) || 0
      }))
    })

  } catch (error) {
    logger.error('Error fetching workshops list', { error })
    return apiError(error, 'Failed to fetch workshops')
  }
}
