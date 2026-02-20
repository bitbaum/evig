/**
 * Service appointment database queries
 */

import { TABLE_NAMES } from '@/config/database'
import { query } from './db-connection'

// ============================================================================
// Service appointment queries
// ============================================================================

export interface DbServiceAppointment {
  id: string
  user_id: string
  service_type_id: string
  preferred_date: Date | null
  confirmed_date: Date | null
  description: string | null
  device_info: string | null
  urgency: string
  status: string
  outcome_notes: string | null
  price_charged_cents: number | null
  created_at: Date
  updated_at: Date
}

export interface DbServiceType {
  id: string
  slug: string
  name: string
  description: string | null
  duration_minutes: number
  price_cents: number | null
  requires_approval: boolean
  is_active: boolean
  created_at: Date
}

/**
 * Get service type by slug
 */
export async function getServiceTypeBySlug(slug: string): Promise<DbServiceType | null> {
  const result = await query<DbServiceType>(
    `SELECT * FROM ${TABLE_NAMES.SERVICE_TYPES} WHERE slug = $1 AND is_active = true`,
    [slug]
  )
  return result.rows[0] || null
}

/**
 * Get user's service appointments
 */
export async function getUserServiceAppointments(userId: string): Promise<Array<DbServiceAppointment & { service_name: string, service_slug: string }>> {
  const result = await query<DbServiceAppointment & { service_name: string, service_slug: string }>(
    `SELECT
       sa.*,
       st.name as service_name,
       st.slug as service_slug
     FROM ${TABLE_NAMES.SERVICE_APPOINTMENTS} sa
     JOIN ${TABLE_NAMES.SERVICE_TYPES} st ON sa.service_type_id = st.id
     WHERE sa.user_id = $1
     ORDER BY sa.created_at DESC`,
    [userId]
  )
  return result.rows
}

/**
 * Check if user has pending appointment for service
 */
export async function hasPendingAppointmentForService(userId: string, serviceSlug: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM ${TABLE_NAMES.SERVICE_APPOINTMENTS} sa
     JOIN ${TABLE_NAMES.SERVICE_TYPES} st ON sa.service_type_id = st.id
     WHERE sa.user_id = $1 AND st.slug = $2 AND sa.status IN ('requested', 'confirmed')`,
    [userId, serviceSlug]
  )
  return result.rows.length > 0
}
