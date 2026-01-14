/**
 * Role checking utilities
 *
 * DRY helper functions for role-based access control
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { apiForbidden } from './helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { ROLES } from '@/lib/constants'

interface UserRoleRow {
  role: string
}

interface ApplicationRow {
  id: string
  status: string
}

/**
 * Check if user is a seller
 * @param userId - User ID to check
 * @returns Promise<boolean> - True if user is a seller
 */
export async function isSeller(userId: string): Promise<boolean> {
  const userCheck = await query(
    `SELECT role FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
    [userId]
  )

  const user = userCheck.rows[0] as UserRoleRow | undefined
  return !!user && user.role === ROLES.SELLER
}

/**
 * Require seller role, return error response if not seller
 * @param userId - User ID to check
 * @returns Promise<NextResponse | null> - Error response if not seller, null if OK
 */
export async function requireSeller(userId: string) {
  const seller = await isSeller(userId)
  if (!seller) {
    return apiForbidden(ERROR_MESSAGES.SELLER_ONLY)
  }
  return null
}

/**
 * Check if user has a pending or approved seller application
 * @param userId - User ID to check
 * @returns Promise<{ hasApplication: boolean; status?: string }>
 */
export async function checkSellerApplication(userId: string): Promise<{
  hasApplication: boolean
  status?: string
}> {
  const existingApplication = await query(
    `SELECT id, status FROM ${TABLE_NAMES.SELLER_APPLICATIONS} WHERE user_id = $1`,
    [userId]
  )

  if (existingApplication.rows.length === 0) {
    return { hasApplication: false }
  }

  const app = existingApplication.rows[0] as ApplicationRow
  return {
    hasApplication: true,
    status: app.status,
  }
}

/**
 * Check if user has a pending or approved repairer application
 * @param userId - User ID to check
 * @returns Promise<{ hasApplication: boolean; status?: string }>
 */
export async function checkRepairerApplication(userId: string): Promise<{
  hasApplication: boolean
  status?: string
}> {
  const existingApplication = await query(
    `SELECT id, status FROM ${TABLE_NAMES.REPAIRER_APPLICATIONS} WHERE user_id = $1`,
    [userId]
  )

  if (existingApplication.rows.length === 0) {
    return { hasApplication: false }
  }

  const app = existingApplication.rows[0] as ApplicationRow
  return {
    hasApplication: true,
    status: app.status,
  }
}

/**
 * Get user role from database
 * @param userId - User ID to check
 * @returns Promise<string | null> - User role or null if not found
 */
export async function getUserRole(userId: string): Promise<string | null> {
  const result = await query(
    `SELECT role FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
    [userId]
  )

  const user = result.rows[0] as UserRoleRow | undefined
  return user?.role ?? null
}
