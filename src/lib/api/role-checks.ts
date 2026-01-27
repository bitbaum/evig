/**
 * Role checking utilities
 *
 * DRY helper functions for role-based access control
 * Following dev guide: docs/development/DEV_GUIDE.md
 *
 * MIGRATION: Seller/repairer checks now use profile tables instead of role field.
 * - Seller: Check seller_profiles table for approved profile
 * - Repairer: Check technician_profiles table for approved profile
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { apiForbidden } from './helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'

interface ApplicationRow {
  id: string
  status: string
}

interface ProfileRow {
  id: string
  status?: string
}

interface UserRoleRow {
  role: string | null
}

/**
 * Check if user is an approved seller
 *
 * Uses seller_profiles table instead of role field (new system).
 * A user is a seller if they have an approved seller profile.
 *
 * @param userId - User ID to check
 * @returns Promise<boolean> - True if user is an approved seller
 */
export async function isSeller(userId: string): Promise<boolean> {
  // Check seller_profiles table for approved profile
  const profileCheck = await query(
    `SELECT id FROM ${TABLE_NAMES.SELLER_PROFILES} WHERE user_id = $1 AND status = 'approved'`,
    [userId]
  )

  if (profileCheck.rows.length > 0) {
    return true
  }

  // Fallback: Check approved seller application
  const appCheck = await query(
    `SELECT id FROM ${TABLE_NAMES.SELLER_APPLICATIONS} WHERE user_id = $1 AND status = 'approved'`,
    [userId]
  )

  return appCheck.rows.length > 0
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
 * Check if user is an approved repairer/technician
 *
 * Uses repairer_profiles table instead of role field (new system).
 * A user is a repairer if they have an approved repairer profile.
 *
 * @param userId - User ID to check
 * @returns Promise<boolean> - True if user is an approved repairer
 */
export async function isRepairer(userId: string): Promise<boolean> {
  // Check repairer_profiles table for approved profile
  const profileCheck = await query(
    `SELECT id FROM ${TABLE_NAMES.REPAIRER_PROFILES} WHERE user_id = $1 AND status = 'approved'`,
    [userId]
  )

  if (profileCheck.rows.length > 0) {
    return true
  }

  // Fallback: Check approved repairer application
  const appCheck = await query(
    `SELECT id FROM ${TABLE_NAMES.REPAIRER_APPLICATIONS} WHERE user_id = $1 AND status = 'approved'`,
    [userId]
  )

  return appCheck.rows.length > 0
}

/**
 * Require repairer role, return error response if not repairer
 * @param userId - User ID to check
 * @returns Promise<NextResponse | null> - Error response if not repairer, null if OK
 */
export async function requireRepairer(userId: string) {
  const repairer = await isRepairer(userId)
  if (!repairer) {
    return apiForbidden(ERROR_MESSAGES.REPAIRER_ONLY)
  }
  return null
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
