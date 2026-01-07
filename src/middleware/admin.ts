/**
 * Multi-role authorization system for RevampIT
 */

import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS, type UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'

/**
 * Check if user has permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  try {
    const session = await auth()
    if (!session?.user?.role) return false

    const userRole = session.user.role as UserRole
    const permissions = ROLE_PERMISSIONS[userRole] || []
    return permissions.includes(permission)
  } catch {
    return false
  }
}

/**
 * Check if user has role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  try {
    const session = await auth()
    return session?.user?.role === role
  } catch {
    return false
  }
}

/**
 * Require specific permission
 */
export async function requirePermission(permission: string) {
  const session = await auth()

  if (!session?.user) {
    throw new Error('Authentication required')
  }

  const userRole = session.user.role as UserRole
  const permissions = ROLE_PERMISSIONS[userRole] || []

  if (!permissions.includes(permission)) {
    throw new Error(`Permission required: ${permission}`)
  }

  return session.user
}

/**
 * Require specific role
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
 * Admin middleware - requires revampit_admin role
 */
export async function adminMiddleware(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(loginUrl)
    }

    if (session.user.role !== ROLES.REVAMPIT_ADMIN) {
      const dashboardUrl = new URL('/dashboard', request.url)
      dashboardUrl.searchParams.set('error', 'access_denied')
      return NextResponse.redirect(dashboardUrl)
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Admin middleware error:', error)
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
