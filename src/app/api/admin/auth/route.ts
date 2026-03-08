import { NextRequest } from 'next/server'
import { verifyAdminPassword, createAdminToken, createAuthCookie, clearAuthCookie } from '@/lib/admin-auth'
import { apiSuccess, apiError, apiBadRequest, apiUnauthorized, apiRateLimited } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { ROLES } from '@/lib/constants'
import { validateBody, AdminAuthActionSchema } from '@/lib/schemas'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateBody(AdminAuthActionSchema, body)
    if (!validation.success) return validation.error
    const { password, action } = validation.data

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

    // Get client info for rate limiting and audit logging
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Verify password (async with rate limiting and audit logging)
    const verification = await verifyAdminPassword(password, ipAddress, userAgent)

    if (!verification.valid) {
      if (verification.retryAfter) {
        return apiRateLimited(verification.error || 'Zu viele Anfragen.', {
          retryAfter: verification.retryAfter,
        })
      }
      return apiUnauthorized(verification.error || 'Invalid password')
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
    logger.error('Admin auth error', { error })
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