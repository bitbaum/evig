/**
 * Role, permission, preference, and segment database queries
 *
 * NOTE: Most tables here (user_roles, permissions, role_permissions,
 * customer_preferences, customer_segments, user_segments) do not have
 * Drizzle schema definitions. We use db.execute(sql`...`) with TABLE_NAMES
 * for those, casting results via `as unknown as T`.
 */

import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { TABLE_NAMES } from '@/config/database'
import type { PreferenceValue, SegmentCriteria } from '@/types/common'
import type { DbUser, DbUserProfile } from './db-users'

// ============================================================================
// Role & permission interfaces
// ============================================================================

export interface DbUserRole {
  id: string
  slug: string
  name: string
  description: string | null
  is_active: boolean
  is_default: boolean
  created_at: Date
  updated_at: Date
}

export interface DbPermission {
  id: string
  slug: string
  name: string
  description: string | null
  resource: string
  action: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface DbRolePermission {
  id: string
  role_id: string
  permission_id: string
  created_at: Date
}

export interface DbCustomerPreference {
  id: string
  user_id: string
  preference_key: string
  preference_value: PreferenceValue
  created_at: Date
  updated_at: Date
}

export interface DbCustomerSegment {
  id: string
  slug: string
  name: string
  description: string | null
  criteria: SegmentCriteria
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface DbUserSegment {
  id: string
  user_id: string
  segment_id: string
  assigned_at: Date
  assigned_by: string | null
  notes: string | null
}

// ============================================================================
// Role & permission queries
// ============================================================================

/**
 * Get user role by ID
 */
export async function getUserRoleById(id: string): Promise<DbUserRole | null> {
  const result = await db.execute(
    sql`SELECT * FROM ${sql.raw(TABLE_NAMES.USER_ROLES)} WHERE id = ${id}`
  )
  const rows = result.rows as unknown as DbUserRole[]
  return rows[0] || null
}

/**
 * Get user role by slug
 */
export async function getUserRoleBySlug(slug: string): Promise<DbUserRole | null> {
  const result = await db.execute(
    sql`SELECT * FROM ${sql.raw(TABLE_NAMES.USER_ROLES)} WHERE slug = ${slug} AND is_active = true`
  )
  const rows = result.rows as unknown as DbUserRole[]
  return rows[0] || null
}

/**
 * Get all active user roles
 */
export async function getActiveUserRoles(): Promise<DbUserRole[]> {
  const result = await db.execute(
    sql`SELECT * FROM ${sql.raw(TABLE_NAMES.USER_ROLES)} WHERE is_active = true ORDER BY name`
  )
  return result.rows as unknown as DbUserRole[]
}

/**
 * Get permissions for a user role
 */
export async function getRolePermissions(roleId: string): Promise<DbPermission[]> {
  const result = await db.execute(
    sql`SELECT p.* FROM ${sql.raw(TABLE_NAMES.PERMISSIONS)} p
     JOIN ${sql.raw(TABLE_NAMES.ROLE_PERMISSIONS)} rp ON p.id = rp.permission_id
     WHERE rp.role_id = ${roleId} AND p.is_active = true
     ORDER BY p.resource, p.action`
  )
  return result.rows as unknown as DbPermission[]
}

/**
 * Check if user has a specific permission
 */
export async function userHasPermission(userId: string, permissionSlug: string): Promise<boolean> {
  const result = await db.execute(
    sql`SELECT 1 FROM ${sql.raw(TABLE_NAMES.ROLE_PERMISSIONS)} rp
     JOIN ${sql.raw(TABLE_NAMES.PERMISSIONS)} p ON rp.permission_id = p.id
     JOIN ${sql.raw(TABLE_NAMES.USERS)} u ON u.role_id = rp.role_id
     WHERE u.id = ${userId} AND p.slug = ${permissionSlug} AND p.is_active = true`
  )
  return result.rows.length > 0
}

// ============================================================================
// Customer preference queries
// ============================================================================

/**
 * Get user customer preferences
 */
export async function getUserPreferences(userId: string): Promise<DbCustomerPreference[]> {
  const result = await db.execute(
    sql`SELECT * FROM ${sql.raw(TABLE_NAMES.CUSTOMER_PREFERENCES)} WHERE user_id = ${userId} ORDER BY preference_key`
  )
  return result.rows as unknown as DbCustomerPreference[]
}

/**
 * Set user customer preference
 */
export async function setUserPreference(
  userId: string,
  key: string,
  value: PreferenceValue
): Promise<DbCustomerPreference> {
  const result = await db.execute(
    sql`INSERT INTO ${sql.raw(TABLE_NAMES.CUSTOMER_PREFERENCES)} (user_id, preference_key, preference_value)
     VALUES (${userId}, ${key}, ${JSON.stringify(value)})
     ON CONFLICT (user_id, preference_key)
     DO UPDATE SET preference_value = EXCLUDED.preference_value, updated_at = NOW()
     RETURNING *`
  )
  const rows = result.rows as unknown as DbCustomerPreference[]
  return rows[0]
}

// ============================================================================
// Customer segment queries
// ============================================================================

/**
 * Get user's customer segments
 */
export async function getUserSegments(userId: string): Promise<Array<DbUserSegment & { segment: DbCustomerSegment }>> {
  const result = await db.execute(
    sql`SELECT us.*, cs.slug, cs.name, cs.description, cs.criteria
     FROM ${sql.raw(TABLE_NAMES.USER_SEGMENTS)} us
     JOIN ${sql.raw(TABLE_NAMES.CUSTOMER_SEGMENTS)} cs ON us.segment_id = cs.id
     WHERE us.user_id = ${userId} AND cs.is_active = true
     ORDER BY us.assigned_at DESC`
  )
  return result.rows as unknown as Array<DbUserSegment & { segment: DbCustomerSegment }>
}

/**
 * Add user to customer segment
 */
export async function addUserToSegment(
  userId: string,
  segmentSlug: string,
  assignedBy?: string,
  notes?: string
): Promise<DbUserSegment | null> {
  const segmentResult = await db.execute(
    sql`SELECT id FROM ${sql.raw(TABLE_NAMES.CUSTOMER_SEGMENTS)} WHERE slug = ${segmentSlug} AND is_active = true`
  )
  const segmentRows = segmentResult.rows as unknown as DbCustomerSegment[]

  if (segmentRows.length === 0) {
    return null
  }

  const segmentId = segmentRows[0].id

  const result = await db.execute(
    sql`INSERT INTO ${sql.raw(TABLE_NAMES.USER_SEGMENTS)} (user_id, segment_id, assigned_by, notes)
     VALUES (${userId}, ${segmentId}, ${assignedBy || null}, ${notes || null})
     ON CONFLICT (user_id, segment_id) DO NOTHING
     RETURNING *`
  )
  const rows = result.rows as unknown as DbUserSegment[]

  return rows[0] || null
}

// ============================================================================
// Composite queries
// ============================================================================

/**
 * Update user's last activity timestamp
 */
export async function updateUserLastActivity(userId: string): Promise<void> {
  await db.execute(
    sql`UPDATE ${sql.raw(TABLE_NAMES.USERS)} SET last_activity_at = NOW() WHERE id = ${userId}`
  )
}

/**
 * Get user with full profile and role information
 */
export async function getUserWithProfile(userId: string): Promise<DbUser & { profile?: DbUserProfile, role_info?: DbUserRole, permissions?: DbPermission[] } | null> {
  const userResult = await db.execute(
    sql`SELECT * FROM ${sql.raw(TABLE_NAMES.USERS)} WHERE id = ${userId}`
  )
  const userRows = userResult.rows as unknown as DbUser[]

  if (userRows.length === 0) {
    return null
  }

  const user = userRows[0]
  const result: DbUser & { profile?: DbUserProfile, role_info?: DbUserRole, permissions?: DbPermission[] } = { ...user }

  // Get profile
  const profileResult = await db.execute(
    sql`SELECT * FROM ${sql.raw(TABLE_NAMES.USER_PROFILES)} WHERE user_id = ${userId}`
  )
  const profileRows = profileResult.rows as unknown as DbUserProfile[]
  result.profile = profileRows[0] || undefined

  // Get role info
  if (user.role_id) {
    const roleResult = await db.execute(
      sql`SELECT * FROM ${sql.raw(TABLE_NAMES.USER_ROLES)} WHERE id = ${user.role_id}`
    )
    const roleRows = roleResult.rows as unknown as DbUserRole[]
    result.role_info = roleRows[0] || undefined

    // Get permissions
    if (result.role_info) {
      result.permissions = await getRolePermissions(user.role_id)
    }
  }

  return result
}
