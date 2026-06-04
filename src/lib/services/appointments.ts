/**
 * Service Appointments — query helpers
 *
 * Single source of truth for listing service appointments. The two callers
 * (user-facing GET at /api/appointments and admin GET at /api/admin/appointments)
 * differ only in the filter applied: regular users see their own bookings
 * (as customer or repairer); staff see all.
 *
 * Keeping the query here — instead of duplicating its 24-column select +
 * 4-table join across two routes — means a schema change touches one file.
 */

import { db } from '@/db'
import {
  serviceAppointments,
  serviceTypes,
  users,
  repairerProfiles,
} from '@/db/schema'
import { eq, and, asc, desc, sql, type SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { notifyUsers } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'

const customer = alias(users, 'customer')
const repairer = alias(users, 'repairer')

export interface AppointmentListFilter {
  /** Filter to appointments where the given userId is the customer. */
  customerId?: string
  /** Filter to appointments where the given userId is the assigned repairer. */
  repairerId?: string
  /** Filter to a specific status from BOOKING_STATUS. */
  status?: string
  limit?: number
  offset?: number
}

/**
 * Selected columns — same shape used by both user and admin routes.
 * Renamed to snake_case for API response consistency with the rest of the codebase.
 */
const APPOINTMENT_SELECT_COLS = {
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
  is_home_visit: serviceAppointments.isHomeVisit,
  visit_address: serviceAppointments.visitAddress,
  visit_city: serviceAppointments.visitCity,
  quoted_price_chf: serviceAppointments.quotedPriceChf,
  diagnosis_notes: serviceAppointments.diagnosisNotes,
  completion_notes: serviceAppointments.completionNotes,
  customer_rating: serviceAppointments.customerRating,
  created_at: serviceAppointments.createdAt,
  updated_at: serviceAppointments.updatedAt,
  customer_name: customer.name,
  customer_email: customer.email,
  repairer_name: repairer.name,
  business_name: repairerProfiles.businessName,
  service_name: serviceTypes.name,
  service_slug: serviceTypes.slug,
} as const

function buildWhere(filter: AppointmentListFilter): SQL | undefined {
  const conds: SQL[] = []
  if (filter.customerId) conds.push(eq(serviceAppointments.userId, filter.customerId))
  if (filter.repairerId) conds.push(eq(serviceAppointments.repairerId, filter.repairerId))
  if (filter.status) conds.push(eq(serviceAppointments.status, filter.status))
  return conds.length ? and(...conds) : undefined
}

export async function listAppointments(filter: AppointmentListFilter) {
  const where = buildWhere(filter)
  const limit = filter.limit ?? 50
  const offset = filter.offset ?? 0

  const rows = await db
    .select(APPOINTMENT_SELECT_COLS)
    .from(serviceAppointments)
    .leftJoin(customer, eq(serviceAppointments.userId, customer.id))
    .leftJoin(repairer, eq(serviceAppointments.repairerId, repairer.id))
    .leftJoin(repairerProfiles, eq(serviceAppointments.repairerProfileId, repairerProfiles.id))
    .leftJoin(serviceTypes, eq(serviceAppointments.serviceTypeId, serviceTypes.id))
    .where(where)
    .orderBy(desc(serviceAppointments.createdAt))
    .limit(limit)
    .offset(offset)

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(serviceAppointments)
    .where(where)

  return {
    appointments: rows,
    pagination: {
      total: Number(countRow?.total ?? 0),
      limit,
      offset,
      hasMore: offset + rows.length < Number(countRow?.total ?? 0),
    },
  }
}

export interface AppointmentStats {
  total: number
  requested: number
  in_progress: number
  completed_today: number
}

export interface AssignableRepairer {
  user_id: string
  name: string | null
  email: string
  city: string | null
  canton: string | null
}

/**
 * Notify a repairer that they've been assigned to a booking.
 *
 * Three callers (auto-assignment in the user POST flow with a
 * pre-selected repairer, admin manual assignment, and any future
 * re-assignment path) used to inline the same title + content +
 * type + related_type — duplicated string copy. Extracting here
 * means changing the wording happens in one place.
 *
 * Fire-and-forget by design — a failed notification must never
 * break the assignment action. Caller can `.catch()` if they want
 * to log, but the function itself swallows nothing.
 */
export function notifyRepairerOfAssignment(
  repairerId: string,
  appointmentId: string,
  description: string | null | undefined,
): Promise<unknown> {
  return notifyUsers([repairerId], {
    type: NOTIFICATION_TYPES.SERVICE_APPOINTMENT_ASSIGNED,
    title: 'Neuer Termin zugewiesen',
    content: `Dir wurde ein neuer Reparaturtermin zugewiesen: ${description?.slice(0, 100) ?? ''}`,
    related_type: RELATED_TYPES.APPOINTMENT,
    related_id: appointmentId,
  })
}

/**
 * Active, verified repairers eligible to be assigned to a booking.
 * Used by the admin appointment-assign UI.
 */
export async function listActiveRepairers(): Promise<AssignableRepairer[]> {
  return db
    .select({
      user_id: repairerProfiles.userId,
      name: users.name,
      email: users.email,
      city: repairerProfiles.city,
      canton: repairerProfiles.canton,
    })
    .from(repairerProfiles)
    .innerJoin(users, eq(repairerProfiles.userId, users.id))
    .where(
      and(
        eq(repairerProfiles.isActive, true),
        eq(repairerProfiles.isVerified, true),
      ),
    )
    .orderBy(asc(users.name))
}

/**
 * Admin overview counters. `requested` is the queue that needs admin attention;
 * `in_progress` covers anything actively being handled.
 */
export async function getAppointmentStats(): Promise<AppointmentStats> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      requested: sql<number>`count(*) FILTER (WHERE ${serviceAppointments.status} = 'requested')::int`,
      in_progress: sql<number>`count(*) FILTER (WHERE ${serviceAppointments.status} IN ('accepted','quoted','quote_approved','in_progress'))::int`,
      completed_today: sql<number>`count(*) FILTER (WHERE ${serviceAppointments.status} = 'completed' AND ${serviceAppointments.updatedAt} >= CURRENT_DATE)::int`,
    })
    .from(serviceAppointments)
  return {
    total: Number(row?.total ?? 0),
    requested: Number(row?.requested ?? 0),
    in_progress: Number(row?.in_progress ?? 0),
    completed_today: Number(row?.completed_today ?? 0),
  }
}
