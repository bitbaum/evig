/**
 * Workshop database queries
 */

import { db } from '@/db'
import { workshops, workshopInstances, workshopRegistrations } from '@/db/schema'
import { eq, and, ne, desc } from 'drizzle-orm'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'

// ============================================================================
// Workshop queries
// ============================================================================

export interface DbWorkshop {
  id: string
  slug: string
  title: string
  description: string | null
  category: string | null
  duration: string | null
  level: string | null
  max_participants: number | null
  price_cents: number | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface DbWorkshopRegistration {
  id: string
  user_id: string
  workshop_instance_id: string
  status: string | null
  payment_status: string | null
  payment_amount_cents: number | null
  payment_reference: string | null
  attended: boolean | null
  rating: number | null
  feedback: string | null
  notes: string | null
  confirmed_at: string | null
  cancelled_at: string | null
  created_at: string | null
  updated_at: string | null
}

/**
 * Get workshop by slug
 */
export async function getWorkshopBySlug(slug: string): Promise<DbWorkshop | null> {
  const rows = await db
    .select({
      id: workshops.id,
      slug: workshops.slug,
      title: workshops.title,
      description: workshops.description,
      category: workshops.category,
      duration: workshops.duration,
      level: workshops.level,
      max_participants: workshops.maxParticipants,
      price_cents: workshops.priceCents,
      is_active: workshops.isActive,
      created_at: workshops.createdAt,
      updated_at: workshops.updatedAt,
    })
    .from(workshops)
    .where(and(eq(workshops.slug, slug), eq(workshops.isActive, true)))

  return rows[0] ?? null
}

/**
 * Get workshops for user (registered or not)
 */
export async function getWorkshopsForUser(userId: string): Promise<Array<DbWorkshop & { registration_status?: string }>> {
  const rows = await db
    .select({
      id: workshops.id,
      slug: workshops.slug,
      title: workshops.title,
      description: workshops.description,
      category: workshops.category,
      duration: workshops.duration,
      level: workshops.level,
      max_participants: workshops.maxParticipants,
      price_cents: workshops.priceCents,
      is_active: workshops.isActive,
      created_at: workshops.createdAt,
      updated_at: workshops.updatedAt,
      registration_status: workshopRegistrations.status,
    })
    .from(workshops)
    .leftJoin(workshopInstances, eq(workshops.id, workshopInstances.workshopId))
    .leftJoin(
      workshopRegistrations,
      and(
        eq(workshopInstances.id, workshopRegistrations.workshopInstanceId),
        eq(workshopRegistrations.userId, userId)
      )
    )
    .where(eq(workshops.isActive, true))
    .orderBy(desc(workshops.createdAt))

  return rows as Array<DbWorkshop & { registration_status?: string }>
}

/**
 * Get user's workshop registrations
 */
export async function getUserWorkshopRegistrations(userId: string): Promise<Array<DbWorkshopRegistration & { workshop_title: string, workshop_slug: string }>> {
  const rows = await db
    .select({
      id: workshopRegistrations.id,
      user_id: workshopRegistrations.userId,
      workshop_instance_id: workshopRegistrations.workshopInstanceId,
      status: workshopRegistrations.status,
      payment_status: workshopRegistrations.paymentStatus,
      payment_amount_cents: workshopRegistrations.paymentAmountCents,
      payment_reference: workshopRegistrations.paymentReference,
      attended: workshopRegistrations.attended,
      rating: workshopRegistrations.rating,
      feedback: workshopRegistrations.feedback,
      notes: workshopRegistrations.notes,
      confirmed_at: workshopRegistrations.confirmedAt,
      cancelled_at: workshopRegistrations.cancelledAt,
      created_at: workshopRegistrations.createdAt,
      updated_at: workshopRegistrations.updatedAt,
      workshop_title: workshops.title,
      workshop_slug: workshops.slug,
    })
    .from(workshopRegistrations)
    .innerJoin(workshopInstances, eq(workshopRegistrations.workshopInstanceId, workshopInstances.id))
    .innerJoin(workshops, eq(workshopInstances.workshopId, workshops.id))
    .where(eq(workshopRegistrations.userId, userId))
    .orderBy(desc(workshopRegistrations.createdAt))

  return rows
}

/**
 * Check if user is registered for a workshop
 */
export async function isUserRegisteredForWorkshop(userId: string, workshopSlug: string): Promise<boolean> {
  const rows = await db
    .select({ id: workshopRegistrations.id })
    .from(workshopRegistrations)
    .innerJoin(workshopInstances, eq(workshopRegistrations.workshopInstanceId, workshopInstances.id))
    .innerJoin(workshops, eq(workshopInstances.workshopId, workshops.id))
    .where(
      and(
        eq(workshopRegistrations.userId, userId),
        eq(workshops.slug, workshopSlug),
        ne(workshopRegistrations.status, WORKSHOP_REGISTRATION_STATUS.CANCELLED)
      )
    )
    .limit(1)

  return rows.length > 0
}
