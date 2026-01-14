import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'

interface RegistrationRow {
  id: string
  workshop_title: string
  workshop_slug: string
  start_date: Date | null
  location: string | null
  status: string
  created_at: Date | null
  updated_at: Date | null
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Get user's workshop registrations with workshop and instance details
    const registrations = await query(`
      SELECT
        wr.id,
        w.title as workshop_title,
        w.slug as workshop_slug,
        wi.start_date,
        wi.location,
        wr.status,
        wr.created_at,
        wr.updated_at
      FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
      JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id
      JOIN ${TABLE_NAMES.WORKSHOPS} w ON wi.workshop_id = w.id
      WHERE wr.user_id = $1
      ORDER BY wr.created_at DESC
    `, [session.user.id])

    return apiSuccess({
      registrations: (registrations.rows as RegistrationRow[]).map(reg => ({
        id: reg.id,
        workshop_title: reg.workshop_title,
        workshop_slug: reg.workshop_slug,
        start_date: reg.start_date?.toISOString(),
        location: reg.location,
        status: reg.status,
        created_at: reg.created_at?.toISOString(),
        updated_at: reg.updated_at?.toISOString(),
      }))
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}