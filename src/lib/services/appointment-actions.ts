/**
 * Appointment Actions Service
 *
 * Business logic for appointment status transitions, DB updates,
 * and email notifications.
 */

import { db } from '@/db'
import { serviceAppointments, serviceTypes, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { logger } from '@/lib/logger'
import { sendCustomEmail, appointmentStatusUpdate, appointmentQuoteReceived } from '@/lib/email'
import {
  getBookingStatusLabel,
  APPOINTMENT_TRANSITIONS,
  type BookingStatus,
} from '@/config/booking-status'
import { TABLE_NAMES } from '@/config/database'
import { guardedTransition, resolveTransition } from '@/lib/lifecycle'
import { APP_URL } from '@/config/urls'
import { SERVICE_APPOINTMENT_ROUTES } from '@/config/service-appointments'

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
 *
 * Legality (who may do what, from which state, → which status) is the
 * `APPOINTMENT_TRANSITIONS` SSOT, decided by the shared `resolveTransition`
 * validator. This function then layers on the per-action SIDE EFFECTS (quote
 * price, completion notes, rating, …) that the table doesn't carry.
 * Returns `{ error }` when the action is not allowed.
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
  // Customer and repairer are distinct accounts on an appointment; map the
  // actor to one role for the table lookup.
  const role = isCustomer ? 'customer' : 'repairer'
  const { action } = actionData

  const resolved = resolveTransition(APPOINTMENT_TRANSITIONS, {
    from: (appointment.status ?? '') as BookingStatus,
    action: action as (typeof APPOINTMENT_TRANSITIONS)[number]['action'],
    role,
  })

  if (!resolved.ok) {
    if (resolved.reason === 'unknown_action') {
      return { error: 'Ungültige Aktion: ' + action }
    }
    const entry = APPOINTMENT_TRANSITIONS.find((t) => t.action === action)!
    return { error: resolved.reason === 'wrong_role' ? entry.roleError : entry.stateError }
  }

  const newStatus = resolved.to
  const updateSet: Record<string, unknown> = {}

  // Per-action side effects (the table owns from/role/to; this owns the fields).
  switch (action) {
    case 'quote':
      updateSet.quotedPriceChf = actionData.quoted_price_chf
      if (actionData.diagnosis_notes) updateSet.diagnosisNotes = actionData.diagnosis_notes
      break
    case 'approve_quote':
      updateSet.quoteApproved = true
      updateSet.quoteApprovedAt = sql`CURRENT_TIMESTAMP`
      break
    case 'start':
      if (actionData.confirmed_date) updateSet.confirmedDate = actionData.confirmed_date
      break
    case 'complete':
      updateSet.completedAt = sql`CURRENT_TIMESTAMP`
      if (actionData.completion_notes) updateSet.completionNotes = actionData.completion_notes
      break
    case 'update':
      if (actionData.description) updateSet.description = actionData.description
      if (actionData.preferred_date) updateSet.preferredDate = actionData.preferred_date
      break
    case 'rate':
      updateSet.customerRating = actionData.customer_rating
      if (actionData.customer_review) updateSet.customerReview = actionData.customer_review
      break
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
 * Apply the appointment update to the database, race-safe.
 *
 * `buildActionUpdate` validated the action against `expectedStatus` (the
 * status read just before). Between that read and this write, a concurrent
 * action (or a double-click) could move the appointment — without a lock both
 * would apply, e.g. double-firing a status change or, for 'rate', writing two
 * ratings. guardedTransition locks the row (FOR UPDATE) and re-checks under it:
 *   - the status is still `expectedStatus` (no concurrent transition won), and
 *   - for 'rate', `customer_rating` is still null (generalises the previous
 *     `isNull(customerRating)` compare-and-set into the same guard).
 * A race-loser fails the re-check and returns null (no write). Returns the
 * updated row, or null when the precondition no longer holds.
 */
export async function executeAppointmentUpdate(
  appointmentId: string,
  action: string,
  updateSet: Record<string, unknown>,
  expectedStatus: string | null
): Promise<typeof serviceAppointments.$inferSelect | null> {
  const res = await guardedTransition<
    { status: string | null; customer_rating: number | null },
    typeof serviceAppointments.$inferSelect | undefined
  >({
    lockTable: TABLE_NAMES.SERVICE_APPOINTMENTS,
    lockId: appointmentId,
    lockColumns: ['status', 'customer_rating'],
    check: (row) => {
      if (expectedStatus !== null && row.status !== expectedStatus) return false
      if (action === 'rate' && row.customer_rating != null) return false
      return true
    },
    apply: async (tx) => {
      const [updated] = await tx
        .update(serviceAppointments)
        .set(updateSet)
        .where(eq(serviceAppointments.id, appointmentId))
        .returning()
      return updated
    },
  })

  return res.ok ? (res.result ?? null) : null
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
      baseUrl + SERVICE_APPOINTMENT_ROUTES.detail(appointmentId)
    )
    sendCustomEmail(party.customer_email, emailContent).catch(err => {
      logger.error('Failed to send quote email', { error: err, appointmentId })
    })
  } else if (['accept', 'reject', 'start', 'complete'].includes(action) && party.customer_email) {
    const emailContent = appointmentStatusUpdate(
      party.customer_name || 'Kunde',
      party.repairer_name || 'Techniker',
      statusLabel,
      serviceName,
      baseUrl + SERVICE_APPOINTMENT_ROUTES.detail(appointmentId)
    )
    sendCustomEmail(party.customer_email, emailContent).catch(err => {
      logger.error('Failed to send status email to customer', { error: err, appointmentId })
    })
  } else if (['approve_quote', 'reject_quote', 'cancel'].includes(action) && party.repairer_email) {
    // Repairer landing destination. /dashboard/appointments?role=repairer
    // — the page uses useAppointments which now passes the role param to
    // /api/appointments (which has supported ?role=repairer since the
    // route was created — only the hook needed to be wired). The
    // previous stopgap pointed at /dashboard/techniker because the hook
    // defaulted to customer-mode and landed repairers on their own
    // bookings; that page didn't list service appointments either. Now
    // the same /dashboard/appointments page renders the repairer's
    // service-appointment workload when ?role=repairer is set.
    const emailContent = appointmentStatusUpdate(
      party.repairer_name || 'Techniker',
      party.customer_name || 'Kunde',
      statusLabel,
      serviceName,
      baseUrl + '/dashboard/appointments?role=repairer'
    )
    sendCustomEmail(party.repairer_email, emailContent).catch(err => {
      logger.error('Failed to send status email to repairer', { error: err, appointmentId })
    })
  }
}
