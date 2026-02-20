/**
 * Workshop database queries
 */

import { TABLE_NAMES } from '@/config/database'
import { query } from './db-connection'

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
  price_cents: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface DbWorkshopRegistration {
  id: string
  user_id: string
  workshop_instance_id: string
  status: string
  payment_status: string
  payment_amount_cents: number | null
  payment_reference: string | null
  attended: boolean
  rating: number | null
  feedback: string | null
  notes: string | null
  confirmed_at: Date | null
  cancelled_at: Date | null
  created_at: Date
  updated_at: Date
}

/**
 * Get workshop by slug
 */
export async function getWorkshopBySlug(slug: string): Promise<DbWorkshop | null> {
  const result = await query<DbWorkshop>(
    `SELECT * FROM ${TABLE_NAMES.WORKSHOPS} WHERE slug = $1 AND is_active = true`,
    [slug]
  )
  return result.rows[0] || null
}

/**
 * Get workshops for user (registered or not)
 */
export async function getWorkshopsForUser(userId: string): Promise<Array<DbWorkshop & { registration_status?: string }>> {
  const result = await query<DbWorkshop & { registration_status?: string }>(
    `SELECT
       w.*,
       wr.status as registration_status
     FROM ${TABLE_NAMES.WORKSHOPS} w
     LEFT JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON w.id = wi.workshop_id
     LEFT JOIN ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr ON wi.id = wr.workshop_instance_id AND wr.user_id = $1
     WHERE w.is_active = true
     ORDER BY w.created_at DESC`,
    [userId]
  )
  return result.rows
}

/**
 * Get user's workshop registrations
 */
export async function getUserWorkshopRegistrations(userId: string): Promise<Array<DbWorkshopRegistration & { workshop_title: string, workshop_slug: string }>> {
  const result = await query<DbWorkshopRegistration & { workshop_title: string, workshop_slug: string }>(
    `SELECT
       wr.*,
       w.title as workshop_title,
       w.slug as workshop_slug
     FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
     JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id
     JOIN ${TABLE_NAMES.WORKSHOPS} w ON wi.workshop_id = w.id
     WHERE wr.user_id = $1
     ORDER BY wr.created_at DESC`,
    [userId]
  )
  return result.rows
}

/**
 * Check if user is registered for a workshop
 */
export async function isUserRegisteredForWorkshop(userId: string, workshopSlug: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
     JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id
     JOIN ${TABLE_NAMES.WORKSHOPS} w ON wi.workshop_id = w.id
     WHERE wr.user_id = $1 AND w.slug = $2 AND wr.status != 'cancelled'`,
    [userId, workshopSlug]
  )
  return result.rows.length > 0
}
