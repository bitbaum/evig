import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'

interface WorkshopIdRow {
  id: string
}

interface InstanceRow {
  id: string
  workshop_id: string
  start_date: Date
  end_date: Date | null
  location: string | null
  max_participants: number
  current_participants: string
  status: string
  created_at: Date
  updated_at: Date
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: workshopSlug } = await params

    // Get workshop ID first
    const workshopResult = await query(
      `SELECT id FROM ${TABLE_NAMES.WORKSHOPS} WHERE slug = $1 AND is_active = true`,
      [workshopSlug]
    )

    if (workshopResult.rows.length === 0) {
      return apiNotFound('Workshop')
    }

    const workshopData = workshopResult.rows[0] as WorkshopIdRow
    const workshopId = workshopData.id

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

    // Return array directly - consistent API pattern
    return apiSuccess(
      (instances.rows as InstanceRow[]).map(instance => ({
        ...instance,
        current_participants: parseInt(instance.current_participants) || 0
      }))
    )

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}