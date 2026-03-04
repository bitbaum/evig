import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { validateBody, AdminWorkshopRegistrationUpdateSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { sendEmail } from '@/lib/email'
import { formatDateTimeWithWeekday } from '@/lib/date-formats'

interface RegistrationDetailsRow {
  user_id: string
  user_name: string
  user_email: string
  workshop_title: string
  start_date: string
}

// PUT /api/admin/workshops/registrations/[id] - Update registration status
export const PUT = withAdmin<{ id: string }>('workshops-admin', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()
    const validation = validateBody(AdminWorkshopRegistrationUpdateSchema, body)
    if (!validation.success) return validation.error
    const { status, attended, notes } = validation.data

    // Check registration exists
    const existingResult = await query(
      `SELECT id FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} WHERE id = $1`,
      [id]
    )

    if (existingResult.rows.length === 0) {
      return apiNotFound('Registration not found')
    }

    // Build update query
    const updates: string[] = []
    const values: (string | boolean | null)[] = []
    let paramIndex = 1

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`)
      values.push(status)
      paramIndex++

      // Auto-set confirmed_at when confirming
      if (status === 'confirmed') {
        updates.push(`confirmed_at = NOW()`)
      }

      // Auto-set cancelled_at when cancelling
      if (status === 'cancelled') {
        updates.push(`cancelled_at = NOW()`)
      }
    }

    if (attended !== undefined) {
      updates.push(`attended = $${paramIndex}`)
      values.push(attended)
      paramIndex++
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`)
      values.push(notes)
      paramIndex++
    }

    if (updates.length === 0) {
      return apiBadRequest('No fields to update')
    }

    values.push(id)

    const result = await query(`
      UPDATE ${TABLE_NAMES.WORKSHOP_REGISTRATIONS}
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values)

    logger.info('Workshop registration updated', {
      registrationId: id,
      updatedBy: session.user.id,
      newStatus: status
    })

    // Send email notification for status changes
    if (status && ['confirmed', 'cancelled', 'waitlist'].includes(status)) {
      try {
        // Get registration details with user and workshop info
        const detailsResult = await query(`
          SELECT
            wr.user_id,
            u.name as user_name,
            u.email as user_email,
            w.title as workshop_title,
            wi.start_date
          FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
          JOIN ${TABLE_NAMES.USERS} u ON wr.user_id = u.id
          JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id
          JOIN ${TABLE_NAMES.WORKSHOPS} w ON wi.workshop_id = w.id
          WHERE wr.id = $1
        `, [id])

        if (detailsResult.rows.length > 0) {
          const details = detailsResult.rows[0] as RegistrationDetailsRow
          const workshopDate = formatDateTimeWithWeekday(details.start_date)

          await sendEmail(
            details.user_email,
            'workshopRegistrationStatusUpdate',
            details.user_name || 'Benutzer',
            details.workshop_title,
            workshopDate,
            status as 'confirmed' | 'cancelled' | 'waitlist',
            notes || undefined
          )

          logger.info('Workshop status update email sent', {
            registrationId: id,
            userId: details.user_id,
            newStatus: status
          })
        }
      } catch (emailError) {
        // Don't fail the update if email fails
        logger.error('Failed to send workshop status update email', { error: emailError })
      }
    }

    return apiSuccess({
      registration: result.rows[0],
      message: 'Registration updated successfully'
    })

  } catch (error) {
    logger.error('Error updating workshop registration', { error })
    return apiError(error, 'Failed to update registration')
  }
})
