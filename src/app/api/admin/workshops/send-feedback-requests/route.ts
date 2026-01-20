import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiForbidden } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { sendEmail } from '@/lib/email'

interface CompletedWorkshopRow {
  instance_id: string
  workshop_title: string
  workshop_slug: string
  start_date: string
  user_id: string
  user_name: string
  user_email: string
  registration_id: string
}

// POST /api/admin/workshops/send-feedback-requests - Send feedback requests for completed workshops
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Authentication required')
    }

    // Check if user is admin
    const userResult = await query(
      `SELECT role FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [session.user.id]
    )
    const userRole = (userResult.rows[0] as { role: string })?.role
    if (userRole !== 'admin') {
      return apiForbidden('Admin access required')
    }

    const body = await request.json()
    const { daysAfterWorkshop = 1 } = body // Default to 1 day after

    // Get all attended registrations for workshops that completed recently and have no feedback yet
    const completedResult = await query(`
      SELECT
        wi.id as instance_id,
        w.title as workshop_title,
        w.slug as workshop_slug,
        wi.start_date,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        wr.id as registration_id
      FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
      JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id
      JOIN ${TABLE_NAMES.WORKSHOPS} w ON wi.workshop_id = w.id
      JOIN ${TABLE_NAMES.USERS} u ON wr.user_id = u.id
      WHERE (wr.status = 'attended' OR wr.attended = true)
        AND wr.rating IS NULL
        AND wr.feedback IS NULL
        AND wi.start_date < NOW()
        AND wi.start_date >= NOW() - INTERVAL '${daysAfterWorkshop + 7} days'
      ORDER BY wi.start_date DESC
    `, [])

    const workshops = completedResult.rows as CompletedWorkshopRow[]
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revampit.ch'

    let sentCount = 0
    let failedCount = 0

    for (const registration of workshops) {
      try {
        const workshopDate = new Date(registration.start_date).toLocaleDateString('de-CH', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        // Link to the workshop page where they can leave feedback
        const feedbackUrl = `${baseUrl}/workshops/${registration.workshop_slug}#feedback`

        await sendEmail(
          registration.user_email,
          'workshopFeedbackRequest',
          registration.user_name || 'Benutzer',
          registration.workshop_title,
          workshopDate,
          feedbackUrl
        )

        sentCount++
        logger.info('Workshop feedback request sent', {
          registrationId: registration.registration_id,
          userId: registration.user_id,
          workshopTitle: registration.workshop_title
        })
      } catch (emailError) {
        failedCount++
        logger.error('Failed to send workshop feedback request', {
          registrationId: registration.registration_id,
          error: emailError
        })
      }
    }

    return apiSuccess({
      message: `Feedback requests sent successfully`,
      total: workshops.length,
      sent: sentCount,
      failed: failedCount
    })

  } catch (error) {
    logger.error('Error sending workshop feedback requests', { error })
    return apiError(error, 'Failed to send feedback requests')
  }
}
