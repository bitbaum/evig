/**
 * Appointment Actions Service
 *
 * Business logic for appointment status transitions, DB updates,
 * and email notifications.
 */

import { db } from '@/db'
import { serviceAppointments, serviceTypes, users } from '@/db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { logger } from '@/lib/logger'
import { sendCustomEmail, appointmentStatusUpdate, appointmentQuoteReceived } from '@/lib/email'
import { BOOKING_STATUS, getBookingStatusLabel } from '@/config/booking-status'
import { APP_URL } from '@/config/urls'

// ============================================================================
// Types
// ============================================================================

interface AppointmentRow {
  id: string
  userId: string
  repairerId: string | null
  status: string | null
}

interface ActionData {
  action: string
  quoted_price_chf?: number
  diagnosis_notes?: string
  confirmed_date?: string
  completion_notes?: string
  description?: string
  preferred_date?: string
  customer_rating?: number
  customer_review?: string
}

export interface ActionResult {
  message: string
  appointment: typeof serviceAppointments.$inferSelect
}

// ============================================================================
// Validation & status transitions
// ============================================================================

/**
 * Validate the action and build the update set.
 * Returns null + error message if the action is not allowed.
 */
export function buildActionUpdate(
  appointment: AppointmentRow,
  actionData: ActionData,
  userId: string
): { updateSet: Record<string, unknown>; newStatus: string | null } | { error: string } {
  const isCustomer = appointment.userId === userId
  const isRepairer = appointment.repairerId === userId

  if (!isCustomer && !isRepairer) {
    return { error: 'Kein Zugriff auf diesen Termin' }
  }

  let newStatus: string | null = null
  const updateSet: Record<string, unknown> = {}
  const { action } = actionData

  switch (action) {
    case 'accept':
      if (!isRepairer) return { error: 'Nur der Techniker kann annehmen' }
      if (appointment.status !== BOOKING_STATUS.REQUESTED) return { error: 'Termin kann nicht angenommen werden' }
      newStatus = BOOKING_STATUS.ACCEPTED
      break

    case 'reject':
      if (!isRepairer) return { error: 'Nur der Techniker kann ablehnen' }
      if (appointment.status !== BOOKING_STATUS.REQUESTED) return { error: 'Termin kann nicht abgelehnt werden' }
      newStatus = BOOKING_STATUS.REJECTED
      break

    case 'quote':
      if (!isRepairer) return { error: 'Nur der Techniker kann Angebote erstellen' }
      if (!([BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTE_REJECTED] as string[]).includes(appointment.status!)) {
        return { error: 'Angebot kann in diesem Status nicht erstellt werden' }
      }
      newStatus = BOOKING_STATUS.QUOTED
      updateSet.quotedPriceChf = actionData.quoted_price_chf
      if (actionData.diagnosis_notes) {
        updateSet.diagnosisNotes = actionData.diagnosis_notes
      }
      break

    case 'approve_quote':
      if (!isCustomer) return { error: 'Nur der Kunde kann Angebote bestätigen' }
      if (appointment.status !== BOOKING_STATUS.QUOTED) return { error: 'Kein Angebot zum Bestätigen' }
      newStatus = BOOKING_STATUS.QUOTE_APPROVED
      updateSet.quoteApproved = true
      updateSet.quoteApprovedAt = sql`CURRENT_TIMESTAMP`
      break

    case 'reject_quote':
      if (!isCustomer) return { error: 'Nur der Kunde kann Angebote ablehnen' }
      if (appointment.status !== BOOKING_STATUS.QUOTED) return { error: 'Kein Angebot zum Ablehnen' }
      newStatus = BOOKING_STATUS.QUOTE_REJECTED
      break

    case 'start':
      if (!isRepairer) return { error: 'Nur der Techniker kann starten' }
      if (!([BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTE_APPROVED] as string[]).includes(appointment.status!)) {
        return { error: 'Termin kann nicht gestartet werden' }
      }
      newStatus = BOOKING_STATUS.IN_PROGRESS
      if (actionData.confirmed_date) {
        updateSet.confirmedDate = actionData.confirmed_date
      }
      break

    case 'complete':
      if (!isRepairer) return { error: 'Nur der Techniker kann abschliessen' }
      if (appointment.status !== BOOKING_STATUS.IN_PROGRESS) return { error: 'Termin ist nicht in Bearbeitung' }
      newStatus = BOOKING_STATUS.COMPLETED
      updateSet.completedAt = sql`CURRENT_TIMESTAMP`
      if (actionData.completion_notes) {
        updateSet.completionNotes = actionData.completion_notes
      }
      break

    case 'update':
      if (!isCustomer) return { error: 'Nur der Kunde kann Angaben bearbeiten' }
      if (appointment.status !== BOOKING_STATUS.REQUESTED) return { error: 'Angaben können nur im Status "Angefragt" bearbeitet werden' }
      if (actionData.description) {
        updateSet.description = actionData.description
      }
      if (actionData.preferred_date) {
        updateSet.preferredDate = actionData.preferred_date
      }
      break

    case 'rate':
      if (!isCustomer) return { error: 'Nur der Kunde kann bewerten' }
      if (appointment.status !== BOOKING_STATUS.COMPLETED) return { error: 'Nur abgeschlossene Termine können bewertet werden' }
      updateSet.customerRating = actionData.customer_rating
      if (actionData.customer_review) {
        updateSet.customerReview = actionData.customer_review
      }
      break

    case 'cancel':
      if (!([BOOKING_STATUS.REQUESTED, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTED, BOOKING_STATUS.QUOTE_APPROVED] as string[]).includes(appointment.status!)) {
        return { error: 'Termin kann nicht mehr storniert werden' }
      }
      newStatus = BOOKING_STATUS.CANCELLED
      break

    default:
      return { error: 'Ungültige Aktion: ' + action }
  }

  if (newStatus) {
    updateSet.status = newStatus
  }
  updateSet.updatedAt = sql`CURRENT_TIMESTAMP`

  return { updateSet, newStatus }
}

// ============================================================================
// Execute update
// ============================================================================

/**
 * Apply the appointment update to the database.
 * For 'rate' action, adds a WHERE condition to prevent double-rating.
 */
export async function executeAppointmentUpdate(
  appointmentId: string,
  action: string,
  updateSet: Record<string, unknown>
): Promise<typeof serviceAppointments.$inferSelect | null> {
  const conditions = [eq(serviceAppointments.id, appointmentId)]
  if (action === 'rate') {
    conditions.push(isNull(serviceAppointments.customerRating))
  }

  const [updated] = await db
    .update(serviceAppointments)
    .set(updateSet)
    .where(and(...conditions))
    .returning()

  return updated ?? null
}

// ============================================================================
// Email notifications
// ============================================================================

const customerAlias = alias(users, 'customer_notify')
const repairerAlias = alias(users, 'repairer_notify')

/**
 * Send fire-and-forget email notifications after an appointment status change.
 */
export async function sendAppointmentNotification(
  appointmentId: string,
  action: string,
  newStatus: string,
  actionData: ActionData
): Promise<void> {
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

  if (!party) return

  const baseUrl = APP_URL
  const serviceName = party.service_name || 'Reparatur'
  const statusLabel = getBookingStatusLabel(newStatus)

  if (action === 'quote' && party.customer_email) {
    const emailContent = appointmentQuoteReceived(
      party.customer_name || 'Kunde',
      party.repairer_name || 'Techniker',
      actionData.quoted_price_chf!,
      actionData.diagnosis_notes || null,
      baseUrl + '/dashboard/bookings'
    )
    sendCustomEmail(party.customer_email, emailContent).catch(err => {
      logger.warn('Failed to send quote email', { error: err, appointmentId })
    })
  } else if (['accept', 'reject', 'start', 'complete'].includes(action) && party.customer_email) {
    const emailContent = appointmentStatusUpdate(
      party.customer_name || 'Kunde',
      party.repairer_name || 'Techniker',
      statusLabel,
      serviceName,
      baseUrl + '/dashboard/bookings'
    )
    sendCustomEmail(party.customer_email, emailContent).catch(err => {
      logger.warn('Failed to send status email to customer', { error: err, appointmentId })
    })
  } else if (['approve_quote', 'reject_quote', 'cancel'].includes(action) && party.repairer_email) {
    const emailContent = appointmentStatusUpdate(
      party.repairer_name || 'Techniker',
      party.customer_name || 'Kunde',
      statusLabel,
      serviceName,
      baseUrl + '/dashboard/appointments'
    )
    sendCustomEmail(party.repairer_email, emailContent).catch(err => {
      logger.warn('Failed to send status email to repairer', { error: err, appointmentId })
    })
  }
}
