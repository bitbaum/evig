/**
 * Admin Access Control Middleware
 *
 * This middleware intelligently routes users to appropriate interfaces based on their roles:
 * - Organization members (@revamp-it.ch) → Admin dashboard
 * - Sellers → Seller dashboard
 * - Customers → Customer dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ROLES, ROLE_PERMISSIONS, PERMISSIONS } from '@/lib/constants'

/**
 * Check if user has admin-level access
 */
export function hasAdminAccess(role: string): boolean {
  const adminRoles = [
    ROLES.REVAMPIT_SUPER_ADMIN,
    ROLES.REVAMPIT_ADMIN,
    ROLES.REVAMPIT_EDITOR,
    ROLES.REVAMPIT_SUPPORT,
    ROLES.PARTNER_ADMIN
  ]
  return adminRoles.includes(role as any)
}

/**
 * Check if user has seller access
 */
export function hasSellerAccess(role: string): boolean {
  const sellerRoles = [
    ROLES.REVAMPIT_SUPER_ADMIN,
    ROLES.REVAMPIT_ADMIN,
    ROLES.SELLER,
    ROLES.PARTNER_ADMIN
  ]
  return sellerRoles.includes(role as any)
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
 */
export async function adminAccessMiddleware(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = session.user.role || ROLES.CUSTOMER

  // Check if user has admin access
  if (!hasAdminAccess(userRole)) {
    // Redirect to appropriate dashboard based on role
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



