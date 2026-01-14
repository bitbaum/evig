import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

interface AppointmentRow {
  id: string
  user_id: string
  repairer_id: string
  status: string
}

// GET /api/appointments/[id] - Get single appointment
export const GET = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: { params?: { id: string } }
) => {
  try {
    const appointmentId = context?.params?.id
    if (!appointmentId) {
      return apiBadRequest('Termin-ID erforderlich')
    }

    const result = await query(
      'SELECT sa.*, c.name as customer_name, c.email as customer_email, ' +
      'r.name as repairer_name, rp.business_name, rp.phone as repairer_phone, ' +
      'st.name as service_name ' +
      'FROM ' + TABLE_NAMES.SERVICE_APPOINTMENTS + ' sa ' +
      'LEFT JOIN ' + TABLE_NAMES.USERS + ' c ON sa.user_id = c.id ' +
      'LEFT JOIN ' + TABLE_NAMES.USERS + ' r ON sa.repairer_id = r.id ' +
      'LEFT JOIN ' + TABLE_NAMES.REPAIRER_PROFILES + ' rp ON sa.repairer_profile_id = rp.id ' +
      'LEFT JOIN ' + TABLE_NAMES.SERVICE_TYPES + ' st ON sa.service_type_id = st.id ' +
      'WHERE sa.id = $1',
      [appointmentId]
    )

    if (result.rows.length === 0) {
      return apiNotFound('Termin nicht gefunden')
    }

    const appointment = result.rows[0] as AppointmentRow

    // Check access - must be customer or repairer
    if (appointment.user_id !== session.user.id && appointment.repairer_id !== session.user.id) {
      return apiForbidden('Kein Zugriff auf diesen Termin')
    }

    logger.info('Appointment fetched', { appointmentId, userId: session.user.id })

    return apiSuccess({ appointment })

  } catch (error) {
    logger.error('Error fetching appointment', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

// PATCH /api/appointments/[id] - Update appointment status
export const PATCH = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: { params?: { id: string } }
) => {
  try {
    const appointmentId = context?.params?.id
    if (!appointmentId) {
      return apiBadRequest('Termin-ID erforderlich')
    }

    const body = await request.json()
    const { action, quoted_price_chf, diagnosis_notes, completion_notes, confirmed_date } = body

    // Get current appointment
    const currentResult = await query(
      'SELECT id, user_id, repairer_id, status FROM ' + TABLE_NAMES.SERVICE_APPOINTMENTS + ' WHERE id = $1',
      [appointmentId]
    )

    if (currentResult.rows.length === 0) {
      return apiNotFound('Termin nicht gefunden')
    }

    const appointment = currentResult.rows[0] as AppointmentRow
    const isCustomer = appointment.user_id === session.user.id
    const isRepairer = appointment.repairer_id === session.user.id

    if (!isCustomer && !isRepairer) {
      return apiForbidden('Kein Zugriff auf diesen Termin')
    }

    // Validate action based on role
    let newStatus: string | null = null
    const updates: string[] = []
    const updateParams: (string | number | null)[] = []
    let paramIndex = 1

    switch (action) {
      case 'accept':
        if (!isRepairer) return apiForbidden('Nur der Reparateur kann annehmen')
        if (appointment.status !== 'requested') return apiBadRequest('Termin kann nicht angenommen werden')
        newStatus = 'accepted'
        break

      case 'reject':
        if (!isRepairer) return apiForbidden('Nur der Reparateur kann ablehnen')
        if (appointment.status !== 'requested') return apiBadRequest('Termin kann nicht abgelehnt werden')
        newStatus = 'rejected'
        break

      case 'quote':
        if (!isRepairer) return apiForbidden('Nur der Reparateur kann Angebote erstellen')
        if (!['accepted', 'quote_rejected'].includes(appointment.status)) {
          return apiBadRequest('Angebot kann in diesem Status nicht erstellt werden')
        }
        if (!quoted_price_chf) return apiBadRequest('Preis erforderlich')
        newStatus = 'quoted'
        updates.push('quoted_price_chf = $' + paramIndex++)
        updateParams.push(quoted_price_chf)
        if (diagnosis_notes) {
          updates.push('diagnosis_notes = $' + paramIndex++)
          updateParams.push(diagnosis_notes)
        }
        break

      case 'approve_quote':
        if (!isCustomer) return apiForbidden('Nur der Kunde kann Angebote bestätigen')
        if (appointment.status !== 'quoted') return apiBadRequest('Kein Angebot zum Bestätigen')
        newStatus = 'quote_approved'
        updates.push('quote_approved = true')
        updates.push('quote_approved_at = CURRENT_TIMESTAMP')
        break

      case 'reject_quote':
        if (!isCustomer) return apiForbidden('Nur der Kunde kann Angebote ablehnen')
        if (appointment.status !== 'quoted') return apiBadRequest('Kein Angebot zum Ablehnen')
        newStatus = 'quote_rejected'
        break

      case 'start':
        if (!isRepairer) return apiForbidden('Nur der Reparateur kann starten')
        if (!['accepted', 'quote_approved'].includes(appointment.status)) {
          return apiBadRequest('Termin kann nicht gestartet werden')
        }
        newStatus = 'in_progress'
        if (confirmed_date) {
          updates.push('confirmed_date = $' + paramIndex++)
          updateParams.push(confirmed_date)
        }
        break

      case 'complete':
        if (!isRepairer) return apiForbidden('Nur der Reparateur kann abschliessen')
        if (appointment.status !== 'in_progress') return apiBadRequest('Termin ist nicht in Bearbeitung')
        newStatus = 'completed'
        updates.push('completed_at = CURRENT_TIMESTAMP')
        if (completion_notes) {
          updates.push('completion_notes = $' + paramIndex++)
          updateParams.push(completion_notes)
        }
        break

      case 'cancel':
        if (!['requested', 'accepted', 'quoted', 'quote_approved'].includes(appointment.status)) {
          return apiBadRequest('Termin kann nicht mehr storniert werden')
        }
        newStatus = 'cancelled'
        break

      default:
        return apiBadRequest('Ungültige Aktion: ' + action)
    }

    // Build update query
    if (newStatus) {
      updates.push('status = $' + paramIndex++)
      updateParams.push(newStatus)
    }
    updates.push('updated_at = CURRENT_TIMESTAMP')
    updateParams.push(appointmentId)

    const updateQuery = 'UPDATE ' + TABLE_NAMES.SERVICE_APPOINTMENTS + ' SET ' +
      updates.join(', ') + ' WHERE id = $' + paramIndex + ' RETURNING *'

    const updateResult = await query(updateQuery, updateParams)

    logger.info('Appointment updated', {
      appointmentId,
      action,
      oldStatus: appointment.status,
      newStatus,
      userId: session.user.id
    })

    return apiSuccess({
      message: 'Termin aktualisiert',
      appointment: updateResult.rows[0]
    })

  } catch (error) {
    logger.error('Error updating appointment', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
