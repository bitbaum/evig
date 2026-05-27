/**
 * Multi-role authorization system for RevampIT
 *
 * Uses the simplified permission system: is_staff + staff_permissions.
 * @see src/lib/permissions.ts
 */

import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'
import { isStaffEmail } from '@/lib/permissions'

/**
 * Check if user has permission (now checks staff_permissions)
 *
 * The new system uses staff_permissions array instead of role-based permissions.
 * Super admins with ['*'] have all permissions.
 */
export async function hasPermission(permission: string): Promise<boolean> {
  try {
    const session = await auth()
    if (!session?.user) return false

    // Super admins have all permissions
    if (session.user.isSuperAdmin) return true

    // Staff with wildcard have all permissions
    const staffPermissions = session.user.staffPermissions || []
    if (staffPermissions.includes('*')) return true

    // Check specific permission in staff_permissions
    return staffPermissions.includes(permission)
  } catch {
    return false
  }
}

/**
 * Require specific permission
 *
 * The new system uses staff_permissions array instead of role-based permissions.
 */
export async function requirePermission(permission: string) {
  const session = await auth()

  if (!session?.user) {
    throw new Error('Authentication required')
  }

  // Super admins have all permissions
  if (session.user.isSuperAdmin) return session.user

  // Staff with wildcard have all permissions
  const staffPermissions = session.user.staffPermissions || []
  if (staffPermissions.includes('*')) return session.user

  // Check specific permission
  if (!staffPermissions.includes(permission)) {
    throw new Error(`Permission required: ${permission}`)
  }

  return session.user
}

/**
 * Admin middleware - requires admin access
 *
 * UNIFIED: Now checks BOTH old role system AND new is_staff system.
 * Old: role === 'REVAMPIT_ADMIN'
 * New: is_staff === true OR email @revamp-it.ch
 */
export async function adminMiddleware(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Check staff access via new permission system
    if (!session.user.isStaff && !isStaffEmail(session.user.email || '')) {
      const dashboardUrl = new URL('/dashboard', request.url)
      dashboardUrl.searchParams.set('error', 'access_denied')
      return NextResponse.redirect(dashboardUrl)
    }

    return NextResponse.next()
  } catch (error) {
    logger.error('Admin middleware error', { error })
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

/**
 * Get current user role
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const session = await auth()
    return session?.user?.role as UserRole || null
  } catch {
    return null
  }
}

/**
 * Check if current user has admin access
 *
 * @returns true if user is staff
 */
export async function hasAdminRole(): Promise<boolean> {
  try {
    const session = await auth()
    if (!session?.user) return false
    return session.user.isStaff || isStaffEmail(session.user.email || '')
  } catch {
    return false
  }
}
