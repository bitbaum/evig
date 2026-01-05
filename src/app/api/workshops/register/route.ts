import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()

    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { workshopSlug } = await request.json()

    if (!workshopSlug) {
      return apiBadRequest('Workshop-Slug erforderlich')
    }

    // Find the workshop
    const workshopResult = await query(
      `SELECT id, title FROM ${TABLE_NAMES.WORKSHOPS} WHERE slug = $1 AND is_active = true`,
      [workshopSlug]
    )

    if (workshopResult.rows.length === 0) {
      return apiNotFound('Workshop')
    }

    const workshop = workshopResult.rows[0]

    // For now, we'll create a registration request without a specific instance
    // In the future, this could be expanded to allow instance selection
    // For now, we'll assume the workshop itself represents the registration

    // Check if user is already registered for this workshop
    const existingResult = await query(
      `SELECT wr.id FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
       JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id
       WHERE wr.user_id = $1 AND wi.workshop_id = $2`,
      [session.user.id, workshop.id]
    )

    if (existingResult.rows.length > 0) {
      return apiError(
        new Error('Already registered'),
        'Bereits für diesen Workshop angemeldet',
        409
      )
    }

    // For now, we'll create a dummy workshop instance if none exists
    // In a real implementation, you'd have proper workshop instances with dates
    let workshopInstanceId

    // Check if there's already a default instance for this workshop
    const instanceResult = await query(
      `SELECT id FROM ${TABLE_NAMES.WORKSHOP_INSTANCES} WHERE workshop_id = $1 LIMIT 1`,
      [workshop.id]
    )

    if (instanceResult.rows.length > 0) {
      workshopInstanceId = instanceResult.rows[0].id
    } else {
      // Create a default instance (this is temporary until proper instance management is implemented)
      const newInstanceResult = await query(
        `INSERT INTO ${TABLE_NAMES.WORKSHOP_INSTANCES} (workshop_id, start_date, location, status)
         VALUES ($1, NOW() + INTERVAL '30 days', 'RevampIT, Birmensdorferstr. 379, 8055 Zürich', 'scheduled')
         RETURNING id`,
        [workshop.id]
      )
      workshopInstanceId = newInstanceResult.rows[0].id
    }

    // Create the registration
    const registrationResult = await query(
      `INSERT INTO ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} (user_id, workshop_instance_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, created_at`,
      [session.user.id, workshopInstanceId]
    )

    return apiSuccess({
      message: 'Erfolgreich für Workshop angemeldet',
      registrationId: registrationResult.rows[0].id,
      workshopTitle: workshop.title
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
