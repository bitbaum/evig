/**
 * Service appointment database queries
 */

import { db } from '@/db'
import { serviceAppointments, serviceTypes } from '@/db/schema'
import { eq, and, inArray, desc } from 'drizzle-orm'
import { APPOINTMENT_STATUS } from '@/config/appointment-status'

// ============================================================================
// Service appointment queries
// ============================================================================

export interface DbServiceAppointment {
  id: string
  user_id: string
  service_type_id: string
  preferred_date: string | null
  confirmed_date: string | null
  description: string | null
  device_info: string | null
  urgency: string | null
  status: string | null
  outcome_notes: string | null
  price_charged_cents: number | null
  created_at: string | null
  updated_at: string | null
}

/**
 * Get user's service appointments
 */
export async function getUserServiceAppointments(userId: string): Promise<Array<DbServiceAppointment & { service_name: string, service_slug: string }>> {
  const rows = await db
    .select({
      id: serviceAppointments.id,
      user_id: serviceAppointments.userId,
      service_type_id: serviceAppointments.serviceTypeId,
      preferred_date: serviceAppointments.preferredDate,
      confirmed_date: serviceAppointments.confirmedDate,
      description: serviceAppointments.description,
      device_info: serviceAppointments.deviceInfo,
      urgency: serviceAppointments.urgency,
      status: serviceAppointments.status,
      outcome_notes: serviceAppointments.outcomeNotes,
      price_charged_cents: serviceAppointments.priceChargedCents,
      created_at: serviceAppointments.createdAt,
      updated_at: serviceAppointments.updatedAt,
      service_name: serviceTypes.name,
      service_slug: serviceTypes.slug,
    })
    .from(serviceAppointments)
    .innerJoin(serviceTypes, eq(serviceAppointments.serviceTypeId, serviceTypes.id))
    .where(eq(serviceAppointments.userId, userId))
    .orderBy(desc(serviceAppointments.createdAt))

  return rows
}

/**
 * Check if user has pending appointment for service
 */
export async function hasPendingAppointmentForService(userId: string, serviceSlug: string): Promise<boolean> {
  const rows = await db
    .select({ id: serviceAppointments.id })
    .from(serviceAppointments)
    .innerJoin(serviceTypes, eq(serviceAppointments.serviceTypeId, serviceTypes.id))
    .where(
      and(
        eq(serviceAppointments.userId, userId),
        eq(serviceTypes.slug, serviceSlug),
        inArray(serviceAppointments.status, [APPOINTMENT_STATUS.REQUESTED, APPOINTMENT_STATUS.CONFIRMED])
      )
    )
    .limit(1)

  return rows.length > 0
}
