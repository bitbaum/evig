import { NextRequest } from 'next/server'
import { db } from '@/db'
import { serviceAppointments, serviceTypes, users, repairerProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { apiError, apiSuccess, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { validateBody, AppointmentActionSchema } from '@/lib/schemas'
import {
  buildActionUpdate,
  executeAppointmentUpdate,
  sendAppointmentNotification,
} from '@/lib/services/appointment-actions'
import { notifyAllStaff } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'

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
      return apiNotFound(ERROR_MESSAGES.APPOINTMENT_NOT_FOUND)
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
      return apiNotFound(ERROR_MESSAGES.APPOINTMENT_NOT_FOUND)
    }

    // Validate action and build update set
    const result = buildActionUpdate(appointment, actionData, session.user.id)

    if ('error' in result) {
      // Permission errors vs validation errors
      const permissionErrors = [
        'Kein Zugriff auf diesen Termin',
        'Nur der Reparateur kann annehmen',
        'Nur der Reparateur kann ablehnen',
        'Nur der Reparateur kann Angebote erstellen',
        'Nur der Kunde kann Angebote bestätigen',
        'Nur der Kunde kann Angebote ablehnen',
        'Nur der Reparateur kann starten',
        'Nur der Reparateur kann abschliessen',
        'Nur der Kunde kann Angaben bearbeiten',
        'Nur der Kunde kann bewerten',
      ]
      if (permissionErrors.includes(result.error)) {
        return apiForbidden(result.error)
      }
      return apiBadRequest(result.error)
    }

    const { updateSet, newStatus } = result

    // Execute the DB update
    const updated = await executeAppointmentUpdate(appointmentId, action, updateSet)

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
      sendAppointmentNotification(appointmentId, action, newStatus, actionData).catch(err => {
        logger.warn('Failed to send appointment notification', { error: err, appointmentId })
      })
    }

    // In-app notification to all staff when appointment is completed
    if (action === 'complete') {
      notifyAllStaff({
        type: NOTIFICATION_TYPES.SERVICE_APPOINTMENT_COMPLETED,
        title: 'Reparaturtermin abgeschlossen',
        content: 'Ein Reparaturtermin wurde als abgeschlossen markiert.',
        related_type: RELATED_TYPES.APPOINTMENT,
        related_id: appointmentId,
      }, session.user.id).catch(() => {})
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
