/**
 * Multi-role authorization system for RevampIT
 *
 * MIGRATION: Now uses unified permissions to support BOTH old role system
 * and new is_staff + staff_permissions system during migration period.
 * @see src/lib/auth/unified-permissions.ts
 */

import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ROLES, type UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'
import {
  hasAdminAccessUnified,
  type UnifiedUser
} from '@/lib/auth/unified-permissions'

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
 * Require specific role (legacy)
 * @deprecated Use requirePermission instead
 */
export async function requireRole(role: UserRole) {
  const session = await auth()

  if (!session?.user) {
    throw new Error('Authentication required')
  }

  if (session.user.role !== role) {
    throw new Error(`Role required: ${role}`)
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

    // UNIFIED: Build user object with both old and new fields
    const user: UnifiedUser = {
      email: session.user.email || '',
      role: session.user.role,
      isStaff: session.user.isStaff,
      staffPermissions: session.user.staffPermissions,
      isSuperAdmin: session.user.isSuperAdmin,
    }

    // UNIFIED: Check both old and new auth systems
    if (!hasAdminAccessUnified(user)) {
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
 * UNIFIED: Check if current user has admin access
 *
 * Unlike hasRole() which checks exact role match, this checks BOTH:
 * - Old system: role in admin roles list
 * - New system: is_staff === true OR email @revamp-it.ch
 *
 * Use this for admin-level permission checks instead of hasRole(ROLES.REVAMPIT_ADMIN)
 *
 * @returns true if user has admin access via either system
 */
export async function hasAdminRole(): Promise<boolean> {
  try {
    const session = await auth()
    if (!session?.user) return false

    const user: UnifiedUser = {
      email: session.user.email || '',
      role: session.user.role,
      isStaff: session.user.isStaff,
      staffPermissions: session.user.staffPermissions,
      isSuperAdmin: session.user.isSuperAdmin,
    }

    return hasAdminAccessUnified(user)
  } catch {
    return false
  }
}
