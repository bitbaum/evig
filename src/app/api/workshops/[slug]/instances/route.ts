import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const workshopSlug = params.slug

    // Get workshop ID first
    const workshopResult = await query(
      `SELECT id FROM ${TABLE_NAMES.WORKSHOPS} WHERE slug = $1 AND is_active = true`,
      [workshopSlug]
    )

    if (workshopResult.rows.length === 0) {
      return apiNotFound('Workshop')
    }

    const workshopId = workshopResult.rows[0].id

    // Get workshop instances
    const instances = await query(`
      SELECT
        wi.*,
        COUNT(wr.id) as current_participants
      FROM ${TABLE_NAMES.WORKSHOP_INSTANCES} wi
      LEFT JOIN ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr ON wi.id = wr.workshop_instance_id
      WHERE wi.workshop_id = $1
      GROUP BY wi.id
      ORDER BY wi.start_date ASC
    `, [workshopId])

    return apiSuccess({
      instances: instances.rows.map(instance => ({
        ...instance,
        current_participants: parseInt(instance.current_participants as string) || 0
      }))
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}