import { NextRequest } from 'next/server'
import { db } from '@/db'
import { serviceAppointments, serviceTypes, users, repairerProfiles } from '@/db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { apiError, apiSuccess, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { validateBody, AppointmentActionSchema } from '@/lib/schemas'
import { sendCustomEmail, appointmentStatusUpdate, appointmentQuoteReceived } from '@/lib/email'
import { BOOKING_STATUS, getBookingStatusLabel } from '@/config/booking-status'
import { APP_URL } from '@/config/urls'

const customerUser = alias(users, 'customer')
const repairerUser = alias(users, 'repairer')

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

    const [appointment] = await db
      .select({
        id: serviceAppointments.id,
        user_id: serviceAppointments.userId,
        repairer_id: serviceAppointments.repairerId,
        repairer_profile_id: serviceAppointments.repairerProfileId,
        service_type_id: serviceAppointments.serviceTypeId,
        description: serviceAppointments.description,
        device_info: serviceAppointments.deviceInfo,
        preferred_date: serviceAppointments.preferredDate,
        confirmed_date: serviceAppointments.confirmedDate,
        urgency: serviceAppointments.urgency,
        status: serviceAppointments.status,
        outcome_notes: serviceAppointments.outcomeNotes,
        price_charged_cents: serviceAppointments.priceChargedCents,
        estimated_duration_hours: serviceAppointments.estimatedDurationHours,
        quoted_price_chf: serviceAppointments.quotedPriceChf,
        quote_approved: serviceAppointments.quoteApproved,
        quote_approved_at: serviceAppointments.quoteApprovedAt,
        diagnosis_notes: serviceAppointments.diagnosisNotes,
        parts_needed: serviceAppointments.partsNeeded,
        parts_ordered_at: serviceAppointments.partsOrderedAt,
        completed_at: serviceAppointments.completedAt,
        completion_notes: serviceAppointments.completionNotes,
        customer_rating: serviceAppointments.customerRating,
        customer_review: serviceAppointments.customerReview,
        reviewed_at: serviceAppointments.reviewedAt,
        last_contact_at: serviceAppointments.lastContactAt,
        messages_count: serviceAppointments.messagesCount,
        is_home_visit: serviceAppointments.isHomeVisit,
        visit_address: serviceAppointments.visitAddress,
        visit_postal_code: serviceAppointments.visitPostalCode,
        visit_city: serviceAppointments.visitCity,
        created_at: serviceAppointments.createdAt,
        updated_at: serviceAppointments.updatedAt,
        customer_name: customerUser.name,
        customer_email: customerUser.email,
        repairer_name: repairerUser.name,
        business_name: repairerProfiles.businessName,
        repairer_phone: repairerProfiles.phone,
        service_name: serviceTypes.name,
      })
      .from(serviceAppointments)
      .leftJoin(customerUser, eq(serviceAppointments.userId, customerUser.id))
      .leftJoin(repairerUser, eq(serviceAppointments.repairerId, repairerUser.id))
      .leftJoin(repairerProfiles, eq(serviceAppointments.repairerProfileId, repairerProfiles.id))
      .leftJoin(serviceTypes, eq(serviceAppointments.serviceTypeId, serviceTypes.id))
      .where(eq(serviceAppointments.id, appointmentId))

    if (!appointment) {
      return apiNotFound('Termin nicht gefunden')
    }

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
const customerAlias = alias(users, 'customer_notify')
const repairerAlias = alias(users, 'repairer_notify')

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
    const [appointment] = await db
      .select({
        id: serviceAppointments.id,
        userId: serviceAppointments.userId,
        repairerId: serviceAppointments.repairerId,
        status: serviceAppointments.status,
      })
      .from(serviceAppointments)
      .where(eq(serviceAppointments.id, appointmentId))

    if (!appointment) {
      return apiNotFound('Termin nicht gefunden')
    }

    const isCustomer = appointment.userId === session.user.id
    const isRepairer = appointment.repairerId === session.user.id

    if (!isCustomer && !isRepairer) {
      return apiForbidden('Kein Zugriff auf diesen Termin')
    }

    // Build dynamic update set based on action
    let newStatus: string | null = null
    const updateSet: Record<string, unknown> = {}

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
        if (!([BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTE_REJECTED] as string[]).includes(appointment.status!)) {
          return apiBadRequest('Angebot kann in diesem Status nicht erstellt werden')
        }
        newStatus = BOOKING_STATUS.QUOTED
        updateSet.quotedPriceChf = actionData.quoted_price_chf
        if (actionData.diagnosis_notes) {
          updateSet.diagnosisNotes = actionData.diagnosis_notes
        }
        break

      case 'approve_quote':
        if (!isCustomer) return apiForbidden('Nur der Kunde kann Angebote bestätigen')
        if (appointment.status !== BOOKING_STATUS.QUOTED) return apiBadRequest('Kein Angebot zum Bestätigen')
        newStatus = BOOKING_STATUS.QUOTE_APPROVED
        updateSet.quoteApproved = true
        updateSet.quoteApprovedAt = sql`CURRENT_TIMESTAMP`
        break

      case 'reject_quote':
        if (!isCustomer) return apiForbidden('Nur der Kunde kann Angebote ablehnen')
        if (appointment.status !== BOOKING_STATUS.QUOTED) return apiBadRequest('Kein Angebot zum Ablehnen')
        newStatus = BOOKING_STATUS.QUOTE_REJECTED
        break

      case 'start':
        if (!isRepairer) return apiForbidden('Nur der Reparateur kann starten')
        if (!([BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTE_APPROVED] as string[]).includes(appointment.status!)) {
          return apiBadRequest('Termin kann nicht gestartet werden')
        }
        newStatus = BOOKING_STATUS.IN_PROGRESS
        if (actionData.confirmed_date) {
          updateSet.confirmedDate = actionData.confirmed_date
        }
        break

      case 'complete':
        if (!isRepairer) return apiForbidden('Nur der Reparateur kann abschliessen')
        if (appointment.status !== BOOKING_STATUS.IN_PROGRESS) return apiBadRequest('Termin ist nicht in Bearbeitung')
        newStatus = BOOKING_STATUS.COMPLETED
        updateSet.completedAt = sql`CURRENT_TIMESTAMP`
        if (actionData.completion_notes) {
          updateSet.completionNotes = actionData.completion_notes
        }
        break

      case 'update':
        if (!isCustomer) return apiForbidden('Nur der Kunde kann Angaben bearbeiten')
        if (appointment.status !== BOOKING_STATUS.REQUESTED) return apiBadRequest('Angaben können nur im Status "Angefragt" bearbeitet werden')
        if (actionData.description) {
          updateSet.description = actionData.description
        }
        if (actionData.preferred_date) {
          updateSet.preferredDate = actionData.preferred_date
        }
        break

      case 'rate':
        if (!isCustomer) return apiForbidden('Nur der Kunde kann bewerten')
        if (appointment.status !== BOOKING_STATUS.COMPLETED) return apiBadRequest('Nur abgeschlossene Termine können bewertet werden')
        updateSet.customerRating = actionData.customer_rating
        if (actionData.customer_review) {
          updateSet.customerReview = actionData.customer_review
        }
        break

      case 'cancel':
        if (!([BOOKING_STATUS.REQUESTED, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTED, BOOKING_STATUS.QUOTE_APPROVED] as string[]).includes(appointment.status!)) {
          return apiBadRequest('Termin kann nicht mehr storniert werden')
        }
        newStatus = BOOKING_STATUS.CANCELLED
        break

      default:
        return apiBadRequest('Ungültige Aktion: ' + action)
    }

    if (newStatus) {
      updateSet.status = newStatus
    }
    updateSet.updatedAt = sql`CURRENT_TIMESTAMP`

    // For 'rate' action, add extra WHERE condition to prevent double-rating
    const conditions = [eq(serviceAppointments.id, appointmentId)]
    if (action === 'rate') {
      conditions.push(isNull(serviceAppointments.customerRating))
    }

    const [updated] = await db
      .update(serviceAppointments)
      .set(updateSet)
      .where(and(...conditions))
      .returning()

    if (!updated && action === 'rate') {
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
      const [party] = await db
        .select({
          customer_name: customerAlias.name,
          customer_email: customerAlias.email,
          repairer_name: repairerAlias.name,
          repairer_email: repairerAlias.email,
          service_name: serviceTypes.name,
        })
        .from(serviceAppointments)
        .leftJoin(customerAlias, eq(serviceAppointments.userId, customerAlias.id))
        .leftJoin(repairerAlias, eq(serviceAppointments.repairerId, repairerAlias.id))
        .leftJoin(serviceTypes, eq(serviceAppointments.serviceTypeId, serviceTypes.id))
        .where(eq(serviceAppointments.id, appointmentId))

      if (party) {
        const baseUrl = APP_URL
        const serviceName = party.service_name || 'Reparatur'
        const statusLabel = getBookingStatusLabel(newStatus)

        if (action === 'quote' && party.customer_email) {
          const emailContent = appointmentQuoteReceived(
            party.customer_name || 'Kunde',
            party.repairer_name || 'Reparateur',
            actionData.quoted_price_chf,
            actionData.diagnosis_notes || null,
            baseUrl + '/dashboard/bookings/' + appointmentId
          )
          sendCustomEmail(party.customer_email, emailContent).catch(err => {
            logger.warn('Failed to send quote email', { error: err, appointmentId })
          })
        } else if (['accept', 'reject', 'start', 'complete'].includes(action) && party.customer_email) {
          const emailContent = appointmentStatusUpdate(
            party.customer_name || 'Kunde',
            party.repairer_name || 'Reparateur',
            statusLabel,
            serviceName,
            baseUrl + '/dashboard/bookings/' + appointmentId
          )
          sendCustomEmail(party.customer_email, emailContent).catch(err => {
            logger.warn('Failed to send status email to customer', { error: err, appointmentId })
          })
        } else if (['approve_quote', 'reject_quote', 'cancel'].includes(action) && party.repairer_email) {
          const emailContent = appointmentStatusUpdate(
            party.repairer_name || 'Reparateur',
            party.customer_name || 'Kunde',
            statusLabel,
            serviceName,
            baseUrl + '/dashboard/repairer/bookings'
          )
          sendCustomEmail(party.repairer_email, emailContent).catch(err => {
            logger.warn('Failed to send status email to repairer', { error: err, appointmentId })
          })
        }
      }
    }

    return apiSuccess({
      message: 'Termin aktualisiert',
      appointment: updated
    })

  } catch (error) {
    logger.error('Error updating appointment', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
