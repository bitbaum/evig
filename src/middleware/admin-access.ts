/**
 * Admin Access Control Middleware
 *
 * This middleware intelligently routes users to appropriate interfaces based on their roles:
 * - Organization members (@revamp-it.ch) → Admin dashboard
 * - Sellers → Seller dashboard
 * - Customers → Customer dashboard
 *
 * MIGRATION: Now uses unified permissions to support BOTH old role system
 * and new is_staff + staff_permissions system during migration period.
 * @see src/lib/auth/unified-permissions.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ROLES } from '@/lib/constants'
import {
  hasAdminAccessUnified,
  isStaffUnified,
  type UnifiedUser
} from '@/lib/auth/unified-permissions'

/**
 * Check if user has admin-level access
 *
 * UNIFIED: Now checks BOTH old role system AND new is_staff system.
 * This prevents staff lockouts during migration period.
 *
 * @param user - User object or role string (for backwards compatibility)
 */
export function hasAdminAccess(userOrRole: string | UnifiedUser): boolean {
  // Backwards compatibility: if string passed, wrap as user object
  if (typeof userOrRole === 'string') {
    return hasAdminAccessUnified({ email: '', role: userOrRole })
  }
  return hasAdminAccessUnified(userOrRole)
}

/**
 * Check if user has seller access
 */
export function hasSellerAccess(role: string): boolean {
  const sellerRoles: string[] = [
    ROLES.REVAMPIT_SUPER_ADMIN,
    ROLES.REVAMPIT_ADMIN,
    ROLES.SELLER,
    ROLES.PARTNER_ADMIN
  ]
  return sellerRoles.includes(role)
}

/**
 * Get appropriate dashboard redirect based on user role
 */
export function getDashboardRedirect(role: string): string {
  if (hasAdminAccess(role)) {
    return '/admin'
  }

  if (hasSellerAccess(role)) {
    return '/dashboard/seller'
  }

  // Default to customer dashboard
  return '/dashboard'
}

/**
 * Admin access middleware
 *
 * UNIFIED: Now uses hasAdminAccessUnified to check both old and new auth systems.
 * This ensures staff with is_staff=true (but no old role) can access admin.
 */
export async function adminAccessMiddleware(request: NextRequest) {
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

  // Check if user has admin access (old OR new system)
  if (!hasAdminAccessUnified(user)) {
    // Redirect to appropriate dashboard based on role
    const userRole = session.user.role || ROLES.CUSTOMER
    const redirectUrl = new URL(getDashboardRedirect(userRole), request.url)
    redirectUrl.searchParams.set('error', 'insufficient_permissions')
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

/**
 * Seller access middleware
 */
export async function sellerAccessMiddleware(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = session.user.role || ROLES.CUSTOMER

  // Check if user has seller access
  if (!hasSellerAccess(userRole)) {
    // If they have admin access, redirect to admin
    if (hasAdminAccess(userRole)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // Otherwise, redirect to customer dashboard
    const redirectUrl = new URL('/dashboard', request.url)
    redirectUrl.searchParams.set('error', 'seller_access_required')
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

/**
 * Universal dashboard redirect middleware
 * Redirects users to their appropriate dashboard based on role
 */
export async function dashboardRedirectMiddleware(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const userRole = session.user.role || ROLES.CUSTOMER
  const currentPath = request.nextUrl.pathname

  // If user is accessing generic /dashboard, redirect to appropriate specific dashboard
  if (currentPath === '/dashboard') {
    const redirectPath = getDashboardRedirect(userRole)
    if (redirectPath !== '/dashboard') {
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
  }

  // If admin user is accessing customer dashboard, redirect to admin
  if (hasAdminAccess(userRole) && currentPath === '/dashboard') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // If seller user is accessing customer dashboard and has seller access, redirect to seller dashboard
  if (hasSellerAccess(userRole) && !hasAdminAccess(userRole) && currentPath === '/dashboard') {
    return NextResponse.redirect(new URL('/dashboard/seller', request.url))
  }

  return NextResponse.next()
}















