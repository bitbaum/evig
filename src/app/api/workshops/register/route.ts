import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

interface WorkshopRow {
  id: string
  title: string
  slug: string
  price_cents: number
}

interface InstanceDetailsRow {
  start_date: string
  location: string | null
}

interface UserRow {
  name: string
  email: string
}

interface IdRow {
  id: string
}

interface RegistrationRow {
  id: string
  created_at: string
}

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
      `SELECT id, title, slug, price_cents FROM ${TABLE_NAMES.WORKSHOPS} WHERE slug = $1 AND is_active = true`,
      [workshopSlug]
    )

    if (workshopResult.rows.length === 0) {
      return apiNotFound('Workshop')
    }

    const workshop = workshopResult.rows[0] as WorkshopRow

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
      workshopInstanceId = (instanceResult.rows[0] as IdRow).id
    } else {
      // Create a default instance (this is temporary until proper instance management is implemented)
      const newInstanceResult = await query(
        `INSERT INTO ${TABLE_NAMES.WORKSHOP_INSTANCES} (workshop_id, start_date, location, status)
         VALUES ($1, NOW() + INTERVAL '30 days', 'RevampIT, Birmensdorferstr. 379, 8055 Zürich', 'scheduled')
         RETURNING id`,
        [workshop.id]
      )
      workshopInstanceId = (newInstanceResult.rows[0] as IdRow).id
    }

    // Create the registration
    const registrationResult = await query(
      `INSERT INTO ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} (user_id, workshop_instance_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, created_at`,
      [session.user.id, workshopInstanceId]
    )

    const registration = registrationResult.rows[0] as RegistrationRow

    // Get user details and workshop instance for email
    const userResult = await query(
      `SELECT name, email FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [session.user.id]
    )
    const user = userResult.rows[0] as UserRow

    const instanceDetailsResult = await query(
      `SELECT start_date, location FROM ${TABLE_NAMES.WORKSHOP_INSTANCES} WHERE id = $1`,
      [workshopInstanceId]
    )
    const instanceDetails = instanceDetailsResult.rows[0] as InstanceDetailsRow

    // Send registration confirmation email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revampit.ch'
    const workshopUrl = `${baseUrl}/workshops/${workshop.slug}`
    const workshopDate = new Date(instanceDetails.start_date).toLocaleDateString('de-CH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    try {
      await sendEmail(
        user.email,
        'workshopRegistrationConfirmation',
        user.name || 'Benutzer',
        workshop.title,
        workshopDate,
        instanceDetails.location || 'Wird noch bekannt gegeben',
        workshop.price_cents || 0,
        workshopUrl
      )
      logger.info('Workshop registration confirmation email sent', {
        userId: session.user.id,
        workshopId: workshop.id,
        registrationId: registration.id
      })
    } catch (emailError) {
      // Don't fail registration if email fails
      logger.error('Failed to send workshop registration email', { error: emailError })
    }

    return apiSuccess({
      message: 'Erfolgreich für Workshop angemeldet',
      registrationId: registration.id,
      workshopTitle: workshop.title
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
