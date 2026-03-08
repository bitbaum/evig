import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { validateBody, AppointmentActionSchema } from '@/lib/schemas'
import { sendCustomEmail, appointmentStatusUpdate, appointmentQuoteReceived } from '@/lib/email'
import { BOOKING_STATUS, getBookingStatusLabel } from '@/config/booking-status'

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
    const validation = validateBody(AppointmentActionSchema, body)
    if (!validation.success) return validation.error
    const actionData = validation.data
    const { action } = actionData

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
        if (appointment.status !== BOOKING_STATUS.REQUESTED) return apiBadRequest('Termin kann nicht angenommen werden')
        newStatus = BOOKING_STATUS.ACCEPTED
        break

      case 'reject':
        if (!isRepairer) return apiForbidden('Nur der Reparateur kann ablehnen')
        if (appointment.status !== BOOKING_STATUS.REQUESTED) return apiBadRequest('Termin kann nicht abgelehnt werden')
        newStatus = BOOKING_STATUS.REJECTED
        break

      case 'quote':
        if (!isRepairer) return apiForbidden('Nur der Reparateur kann Angebote erstellen')
        if (!([BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTE_REJECTED] as string[]).includes(appointment.status)) {
          return apiBadRequest('Angebot kann in diesem Status nicht erstellt werden')
        }
        newStatus = BOOKING_STATUS.QUOTED
        updates.push('quoted_price_chf = $' + paramIndex++)
        updateParams.push(actionData.quoted_price_chf)
        if (actionData.diagnosis_notes) {
          updates.push('diagnosis_notes = $' + paramIndex++)
          updateParams.push(actionData.diagnosis_notes)
        }
        break

      case 'approve_quote':
        if (!isCustomer) return apiForbidden('Nur der Kunde kann Angebote bestätigen')
        if (appointment.status !== BOOKING_STATUS.QUOTED) return apiBadRequest('Kein Angebot zum Bestätigen')
        newStatus = BOOKING_STATUS.QUOTE_APPROVED
        updates.push('quote_approved = true')
        updates.push('quote_approved_at = CURRENT_TIMESTAMP')
        break

      case 'reject_quote':
        if (!isCustomer) return apiForbidden('Nur der Kunde kann Angebote ablehnen')
        if (appointment.status !== BOOKING_STATUS.QUOTED) return apiBadRequest('Kein Angebot zum Ablehnen')
        newStatus = BOOKING_STATUS.QUOTE_REJECTED
        break

      case 'start':
        if (!isRepairer) return apiForbidden('Nur der Reparateur kann starten')
        if (!([BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTE_APPROVED] as string[]).includes(appointment.status)) {
          return apiBadRequest('Termin kann nicht gestartet werden')
        }
        newStatus = BOOKING_STATUS.IN_PROGRESS
        if (actionData.confirmed_date) {
          updates.push('confirmed_date = $' + paramIndex++)
          updateParams.push(actionData.confirmed_date)
        }
        break

      case 'complete':
        if (!isRepairer) return apiForbidden('Nur der Reparateur kann abschliessen')
        if (appointment.status !== BOOKING_STATUS.IN_PROGRESS) return apiBadRequest('Termin ist nicht in Bearbeitung')
        newStatus = BOOKING_STATUS.COMPLETED
        updates.push('completed_at = CURRENT_TIMESTAMP')
        if (actionData.completion_notes) {
          updates.push('completion_notes = $' + paramIndex++)
          updateParams.push(actionData.completion_notes)
        }
        break

      case 'update':
        if (!isCustomer) return apiForbidden('Nur der Kunde kann Angaben bearbeiten')
        if (appointment.status !== BOOKING_STATUS.REQUESTED) return apiBadRequest('Angaben können nur im Status "Angefragt" bearbeitet werden')
        if (actionData.description) {
          updates.push('description = $' + paramIndex++)
          updateParams.push(actionData.description)
        }
        if (actionData.preferred_date) {
          updates.push('preferred_date = $' + paramIndex++)
          updateParams.push(actionData.preferred_date)
        }
        break

      case 'rate':
        if (!isCustomer) return apiForbidden('Nur der Kunde kann bewerten')
        if (appointment.status !== BOOKING_STATUS.COMPLETED) return apiBadRequest('Nur abgeschlossene Termine können bewertet werden')
        // Prevent double-rating — checked via SQL WHERE clause below
        updates.push('customer_rating = $' + paramIndex++)
        updateParams.push(actionData.customer_rating)
        if (actionData.customer_review) {
          updates.push('customer_review = $' + paramIndex++)
          updateParams.push(actionData.customer_review)
        }
        break

      case 'cancel':
        if (!([BOOKING_STATUS.REQUESTED, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTED, BOOKING_STATUS.QUOTE_APPROVED] as string[]).includes(appointment.status)) {
          return apiBadRequest('Termin kann nicht mehr storniert werden')
        }
        newStatus = BOOKING_STATUS.CANCELLED
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

    let whereClause = 'WHERE id = $' + paramIndex
    // Prevent double-rating at the SQL level
    if (action === 'rate') {
      whereClause += ' AND customer_rating IS NULL'
    }

    const updateQuery = 'UPDATE ' + TABLE_NAMES.SERVICE_APPOINTMENTS + ' SET ' +
      updates.join(', ') + ' ' + whereClause + ' RETURNING *'

    const updateResult = await query(updateQuery, updateParams)

    if (updateResult.rows.length === 0 && action === 'rate') {
      return apiBadRequest('Dieser Termin wurde bereits bewertet')
    }

    logger.info('Appointment updated', {
      appointmentId,
      action,
      oldStatus: appointment.status,
      newStatus,
      userId: session.user.id
    })

    // Fire-and-forget email notifications
    if (newStatus && action !== 'update') {
      const partyResult = await query(
        'SELECT c.name as customer_name, c.email as customer_email, ' +
        'r.name as repairer_name, r.email as repairer_email, ' +
        'st.name as service_name ' +
        'FROM ' + TABLE_NAMES.SERVICE_APPOINTMENTS + ' sa ' +
        'LEFT JOIN ' + TABLE_NAMES.USERS + ' c ON sa.user_id = c.id ' +
        'LEFT JOIN ' + TABLE_NAMES.USERS + ' r ON sa.repairer_id = r.id ' +
        'LEFT JOIN ' + TABLE_NAMES.SERVICE_TYPES + ' st ON sa.service_type_id = st.id ' +
        'WHERE sa.id = $1',
        [appointmentId]
      )
      if (partyResult.rows.length > 0) {
        const p = partyResult.rows[0] as {
          customer_name: string | null; customer_email: string;
          repairer_name: string | null; repairer_email: string | null;
          service_name: string | null
        }
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://revamp-it.ch'
        const serviceName = p.service_name || 'Reparatur'
        const statusLabel = getBookingStatusLabel(newStatus)

        if (action === 'quote' && p.customer_email) {
          // Quote → special email to customer
          const emailContent = appointmentQuoteReceived(
            p.customer_name || 'Kunde',
            p.repairer_name || 'Reparateur',
            actionData.quoted_price_chf,
            actionData.diagnosis_notes || null,
            baseUrl + '/dashboard/bookings/' + appointmentId
          )
          sendCustomEmail(p.customer_email, emailContent).catch(err => {
            logger.warn('Failed to send quote email', { error: err, appointmentId })
          })
        } else if (['accept', 'reject', 'start', 'complete'].includes(action) && p.customer_email) {
          // Repairer actions → notify customer
          const emailContent = appointmentStatusUpdate(
            p.customer_name || 'Kunde',
            p.repairer_name || 'Reparateur',
            statusLabel,
            serviceName,
            baseUrl + '/dashboard/bookings/' + appointmentId
          )
          sendCustomEmail(p.customer_email, emailContent).catch(err => {
            logger.warn('Failed to send status email to customer', { error: err, appointmentId })
          })
        } else if (['approve_quote', 'reject_quote', 'cancel'].includes(action) && p.repairer_email) {
          // Customer actions → notify repairer
          const emailContent = appointmentStatusUpdate(
            p.repairer_name || 'Reparateur',
            p.customer_name || 'Kunde',
            statusLabel,
            serviceName,
            baseUrl + '/dashboard/repairer/bookings'
          )
          sendCustomEmail(p.repairer_email, emailContent).catch(err => {
            logger.warn('Failed to send status email to repairer', { error: err, appointmentId })
          })
        }
      }
    }

    return apiSuccess({
      message: 'Termin aktualisiert',
      appointment: updateResult.rows[0]
    })

  } catch (error) {
    logger.error('Error updating appointment', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
