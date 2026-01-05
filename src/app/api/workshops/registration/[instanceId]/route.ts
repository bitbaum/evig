import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { instanceId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiSuccess({
        registered: false,
        requiresAuth: true
      })
    }

    const instanceId = params.instanceId

    // Check if user is registered for this workshop instance
    const registration = await query(`
      SELECT
        wr.*,
        wi.start_date,
        wi.location,
        w.title as workshop_title,
        w.slug as workshop_slug
      FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
      JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id
      JOIN ${TABLE_NAMES.WORKSHOPS} w ON wi.workshop_id = w.id
      WHERE wr.user_id = $1 AND wr.workshop_instance_id = $2
    `, [session.user.id, instanceId])

    if (registration.rows.length > 0) {
      const reg = registration.rows[0]
      return apiSuccess({
        registered: true,
        registration: {
          id: reg.id,
          status: reg.status,
          registered_at: reg.created_at,
          workshop_instance: {
            start_date: reg.start_date,
            location: reg.location,
            workshop_title: reg.workshop_title,
            workshop_slug: reg.workshop_slug
          }
        }
      })
    }

    return apiSuccess({
      registered: false,
      canRegister: true
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}