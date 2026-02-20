/**
 * Role, permission, preference, and segment database queries
 */

import { TABLE_NAMES } from '@/config/database'
import type { PreferenceValue, SegmentCriteria } from '@/types/common'
import { query } from './db-connection'
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
  const result = await query<DbUserRole>(
    `SELECT * FROM ${TABLE_NAMES.USER_ROLES} WHERE id = $1`,
    [id]
  )
  return result.rows[0] || null
}

/**
 * Get user role by slug
 */
export async function getUserRoleBySlug(slug: string): Promise<DbUserRole | null> {
  const result = await query<DbUserRole>(
    `SELECT * FROM ${TABLE_NAMES.USER_ROLES} WHERE slug = $1 AND is_active = true`,
    [slug]
  )
  return result.rows[0] || null
}

/**
 * Get all active user roles
 */
export async function getActiveUserRoles(): Promise<DbUserRole[]> {
  const result = await query<DbUserRole>(
    `SELECT * FROM ${TABLE_NAMES.USER_ROLES} WHERE is_active = true ORDER BY name`
  )
  return result.rows
}

/**
 * Get permissions for a user role
 */
export async function getRolePermissions(roleId: string): Promise<DbPermission[]> {
  const result = await query<DbPermission>(
    `SELECT p.* FROM ${TABLE_NAMES.PERMISSIONS} p
     JOIN ${TABLE_NAMES.ROLE_PERMISSIONS} rp ON p.id = rp.permission_id
     WHERE rp.role_id = $1 AND p.is_active = true
     ORDER BY p.resource, p.action`,
    [roleId]
  )
  return result.rows
}

/**
 * Check if user has a specific permission
 */
export async function userHasPermission(userId: string, permissionSlug: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM ${TABLE_NAMES.ROLE_PERMISSIONS} rp
     JOIN ${TABLE_NAMES.PERMISSIONS} p ON rp.permission_id = p.id
     JOIN ${TABLE_NAMES.USERS} u ON u.role_id = rp.role_id
     WHERE u.id = $1 AND p.slug = $2 AND p.is_active = true`,
    [userId, permissionSlug]
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
  const result = await query<DbCustomerPreference>(
    `SELECT * FROM ${TABLE_NAMES.CUSTOMER_PREFERENCES} WHERE user_id = $1 ORDER BY preference_key`,
    [userId]
  )
  return result.rows
}

/**
 * Set user customer preference
 */
export async function setUserPreference(
  userId: string,
  key: string,
  value: PreferenceValue
): Promise<DbCustomerPreference> {
  const result = await query<DbCustomerPreference>(
    `INSERT INTO ${TABLE_NAMES.CUSTOMER_PREFERENCES} (user_id, preference_key, preference_value)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, preference_key)
     DO UPDATE SET preference_value = EXCLUDED.preference_value, updated_at = NOW()
     RETURNING *`,
    [userId, key, JSON.stringify(value)]
  )
  return result.rows[0]
}

// ============================================================================
// Customer segment queries
// ============================================================================

/**
 * Get user's customer segments
 */
export async function getUserSegments(userId: string): Promise<Array<DbUserSegment & { segment: DbCustomerSegment }>> {
  const result = await query<DbUserSegment & { segment: DbCustomerSegment }>(
    `SELECT us.*, cs.slug, cs.name, cs.description, cs.criteria
     FROM ${TABLE_NAMES.USER_SEGMENTS} us
     JOIN ${TABLE_NAMES.CUSTOMER_SEGMENTS} cs ON us.segment_id = cs.id
     WHERE us.user_id = $1 AND cs.is_active = true
     ORDER BY us.assigned_at DESC`,
    [userId]
  )
  return result.rows
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
  const segmentResult = await query<DbCustomerSegment>(
    `SELECT id FROM ${TABLE_NAMES.CUSTOMER_SEGMENTS} WHERE slug = $1 AND is_active = true`,
    [segmentSlug]
  )

  if (segmentResult.rows.length === 0) {
    return null
  }

  const segmentId = segmentResult.rows[0].id

  const result = await query<DbUserSegment>(
    `INSERT INTO ${TABLE_NAMES.USER_SEGMENTS} (user_id, segment_id, assigned_by, notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, segment_id) DO NOTHING
     RETURNING *`,
    [userId, segmentId, assignedBy || null, notes || null]
  )

  return result.rows[0] || null
}

// ============================================================================
// Composite queries
// ============================================================================

/**
 * Update user's last activity timestamp
 */
export async function updateUserLastActivity(userId: string): Promise<void> {
  await query(
    `UPDATE ${TABLE_NAMES.USERS} SET last_activity_at = NOW() WHERE id = $1`,
    [userId]
  )
}

/**
 * Get user with full profile and role information
 */
export async function getUserWithProfile(userId: string): Promise<DbUser & { profile?: DbUserProfile, role_info?: DbUserRole, permissions?: DbPermission[] } | null> {
  const userResult = await query<DbUser>(
    `SELECT * FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
    [userId]
  )

  if (userResult.rows.length === 0) {
    return null
  }

  const user = userResult.rows[0]
  const result: DbUser & { profile?: DbUserProfile, role_info?: DbUserRole, permissions?: DbPermission[] } = { ...user }

  // Get profile
  const profileResult = await query<DbUserProfile>(
    `SELECT * FROM ${TABLE_NAMES.USER_PROFILES} WHERE user_id = $1`,
    [userId]
  )
  result.profile = profileResult.rows[0] || undefined

  // Get role info
  if (user.role_id) {
    const roleResult = await query<DbUserRole>(
      `SELECT * FROM ${TABLE_NAMES.USER_ROLES} WHERE id = $1`,
      [user.role_id]
    )
    result.role_info = roleResult.rows[0] || undefined

    // Get permissions
    if (result.role_info) {
      result.permissions = await getRolePermissions(user.role_id)
    }
  }

  return result
}
