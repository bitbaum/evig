import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getJwtSecret } from '@/lib/admin-auth'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { CMS_CONFIG } from '@/config/cms'

export const dynamic = 'force-dynamic'

const REBOOT_CONTENT_URL = CMS_CONFIG.URL

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return apiBadRequest('Email and password are required')
    }

    // Forward login request to Reboot Content API
    const response = await fetch(`${REBOOT_CONTENT_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { success: false, error: errorData.error || 'Invalid credentials' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Create our own JWT for the admin interface
    const token = jwt.sign(
      {
        userId: data.user.id,
        email: data.user.email,
        role: data.user.role,
      },
      getJwtSecret(),
      { expiresIn: '24h' }
    )

    // Set HTTP-only cookie with the JWT
    const cookieStore = await cookies()
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    return apiSuccess({
      user: data.user,
    })
  } catch (error) {
    return apiError(error, 'Internal server error')
  }
}
