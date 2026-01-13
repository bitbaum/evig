import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appointmentId } = await params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }
    const body = await request.json()

    // Verify the appointment belongs to the user
    const appointmentCheck = await query(
      `SELECT user_id, status FROM ${TABLE_NAMES.SERVICE_APPOINTMENTS} WHERE id = $1`,
      [appointmentId]
    )

    if (appointmentCheck.rows.length === 0) {
      return apiNotFound('Termin')
    }

    const appointment = appointmentCheck.rows[0]

    if (appointment.user_id !== session.user.id) {
      return apiForbidden(ERROR_MESSAGES.FORBIDDEN)
    }

    // Handle cancellation (no body provided)
    if (Object.keys(body).length === 0) {
      // Only allow cancellation for non-completed appointments
      if (appointment.status === 'completed') {
        return apiBadRequest(ERROR_MESSAGES.CANNOT_CANCEL_COMPLETED)
      }

      // Update appointment status to cancelled
      await query(
        `UPDATE ${TABLE_NAMES.SERVICE_APPOINTMENTS} SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        ['cancelled', appointmentId]
      )

      return apiSuccess({
        message: 'Termin erfolgreich storniert'
      })
    }

    // Handle editing (body provided)
    if (appointment.status !== 'requested') {
      return apiBadRequest(ERROR_MESSAGES.CAN_ONLY_EDIT_REQUESTED)
    }

    const { description, preferred_date } = body
    const updates: string[] = []
    const values: unknown[] = []
    let paramCount = 1

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`)
      values.push(description)
      paramCount++
    }

    if (preferred_date) {
      updates.push(`preferred_date = $${paramCount}`)
      values.push(new Date(preferred_date))
      paramCount++
    }

    if (updates.length === 0) {
      return apiBadRequest('Keine Änderungen angegeben')
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(appointmentId)

    await query(
      `UPDATE ${TABLE_NAMES.SERVICE_APPOINTMENTS} SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    )

    return apiSuccess({
      message: 'Termin erfolgreich aktualisiert'
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}