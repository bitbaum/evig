/**
 * Authentication middleware for user-facing routes
 */

import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Require authentication for user routes
 */
export async function requireAuth() {
  const session = await auth()

  if (!session?.user) {
    throw new Error('Authentication required')
  }

  return session.user
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await auth()
    return !!session?.user
  } catch {
    return false
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  try {
    const session = await auth()
    return session?.user || null
  } catch {
    return null
  }
}

/**
 * User authentication middleware - redirects to login if not authenticated
 */
export async function userMiddleware(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  } catch (error) {
    logger.error('User middleware error', { error })
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}
