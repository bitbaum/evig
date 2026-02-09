import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiForbidden } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { sendEmail } from '@/lib/email'
import { formatDateWithWeekday } from '@/lib/date-formats'

interface UpcomingWorkshopRow {
  instance_id: string
  workshop_title: string
  workshop_slug: string
  start_date: string
  location: string | null
  instructor: string | null
  user_id: string
  user_name: string
  user_email: string
  registration_id: string
}

// POST /api/admin/workshops/send-reminders - Send reminders for upcoming workshops
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
    const { daysBeforeWorkshop = 1 } = body // Default to 1 day before

    // Get all confirmed registrations for workshops happening in the specified days
    const upcomingResult = await query(`
      SELECT
        wi.id as instance_id,
        w.title as workshop_title,
        w.slug as workshop_slug,
        wi.start_date,
        wi.location,
        wi.instructor,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        wr.id as registration_id
      FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
      JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id
      JOIN ${TABLE_NAMES.WORKSHOPS} w ON wi.workshop_id = w.id
      JOIN ${TABLE_NAMES.USERS} u ON wr.user_id = u.id
      WHERE wr.status = 'confirmed'
        AND wi.status = 'scheduled'
        AND wi.start_date >= NOW()
        AND wi.start_date <= NOW() + INTERVAL '${daysBeforeWorkshop} days'
      ORDER BY wi.start_date ASC
    `, [])

    const workshops = upcomingResult.rows as UpcomingWorkshopRow[]
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revampit.ch'

    let sentCount = 0
    let failedCount = 0

    for (const registration of workshops) {
      try {
        const workshopDate = formatDateWithWeekday(registration.start_date)
        const workshopTime = new Date(registration.start_date).toLocaleTimeString('de-CH', {
          hour: '2-digit',
          minute: '2-digit'
        })
        const workshopUrl = `${baseUrl}/workshops/${registration.workshop_slug}`

        await sendEmail(
          registration.user_email,
          'workshopReminder',
          registration.user_name || 'Benutzer',
          registration.workshop_title,
          workshopDate,
          workshopTime,
          registration.location || 'Wird noch bekannt gegeben',
          registration.instructor,
          workshopUrl
        )

        sentCount++
        logger.info('Workshop reminder sent', {
          registrationId: registration.registration_id,
          userId: registration.user_id,
          workshopTitle: registration.workshop_title
        })
      } catch (emailError) {
        failedCount++
        logger.error('Failed to send workshop reminder', {
          registrationId: registration.registration_id,
          error: emailError
        })
      }
    }

    return apiSuccess({
      message: `Reminders sent successfully`,
      total: workshops.length,
      sent: sentCount,
      failed: failedCount
    })

  } catch (error) {
    logger.error('Error sending workshop reminders', { error })
    return apiError(error, 'Failed to send reminders')
  }
}
