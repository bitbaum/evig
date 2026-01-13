import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword, createAdminToken, createAuthCookie, clearAuthCookie } from '@/lib/admin-auth'
import { apiSuccess, apiError, apiBadRequest, apiUnauthorized } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { ROLES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password, action } = body

    // Handle logout
    if (action === 'logout') {
      const response = apiSuccess({ message: 'Logged out successfully' })
      response.headers.set('Set-Cookie', clearAuthCookie())
      return response
    }

    // Handle login
    if (!password) {
      return apiBadRequest('Password is required')
    }

    if (!verifyAdminPassword(password)) {
      return apiUnauthorized('Invalid password')
    }

    // Create JWT token
    const token = createAdminToken()
    
    // Create response with auth cookie
    const response = apiSuccess({
      message: 'Login successful',
      user: {
        email: 'admin@revampit.ch',
        role: ROLES.REVAMPIT_ADMIN
      }
    })

    response.headers.set('Set-Cookie', createAuthCookie(token))
    
    return response

  } catch (error) {
    return apiError(error, 'Internal server error')
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie')
    const { getTokenFromCookies, verifyAdminToken } = await import('@/lib/admin-auth')
    
    const token = getTokenFromCookies(cookieHeader || undefined)
    
    if (!token) {
      return apiUnauthorized('Not authenticated')
    }

    const adminUser = verifyAdminToken(token)
    
    if (!adminUser) {
      return apiUnauthorized('Invalid token')
    }

    return apiSuccess({ 
      authenticated: true,
      user: {
        email: adminUser.email,
        role: adminUser.role
      }
    })

  } catch (error) {
    return apiError(error, 'Authentication check failed', 500)
  }
}