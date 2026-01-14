import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Clear the admin token cookie
    const cookieStore = await cookies()
    cookieStore.set('admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return apiSuccess({
      message: 'Logged out successfully',
    })
  } catch (error) {
    return apiError(error, 'Internal server error')
  }
}
