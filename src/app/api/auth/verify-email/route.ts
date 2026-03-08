import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailWithToken } from '@/lib/auth/db'
import { sendEmail } from '@/lib/email'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateBody, VerifyEmailTokenSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateBody(VerifyEmailTokenSchema, body)
    if (!validation.success) return validation.error
    const { token } = validation.data

    const result = await verifyEmailWithToken(token)

    if (!result.success) {
      return apiBadRequest(result.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
    }

    // Send welcome email
    try {
      const { APP_URL } = require('@/config/urls')
      const userResult = await fetch(`${APP_URL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Note: This would need proper authentication in a real implementation
        }
      })

      if (userResult.ok) {
        const userData = await userResult.json()
        const userName = userData.first_name || userData.last_name || 'RevampIT Benutzer'
        await sendEmail(result.email!, 'welcome', userName)
      }
    } catch (emailError) {
      logger.error('Failed to send welcome email', { error: emailError })
      // Don't fail the verification if welcome email fails
    }

    return apiSuccess({
      message: 'E-Mail-Adresse erfolgreich bestätigt! Sie können sich jetzt anmelden.',
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/auth/login?error=invalid_token', request.url))
    }

    const result = await verifyEmailWithToken(token)

    if (!result.success) {
      return NextResponse.redirect(new URL('/auth/login?error=verification_failed', request.url))
    }

    // Send welcome email
    try {
      // Get user info for personalized welcome email
      // This is a simplified approach - in production you'd want to get user details
      await sendEmail(result.email!, 'welcome', 'RevampIT Benutzer')
    } catch (emailError) {
      logger.error('Failed to send welcome email', { error: emailError })
    }

    // Redirect to login with success message
    return NextResponse.redirect(new URL('/auth/login?verified=true', request.url))
  } catch (error) {
    logger.error('Email verification GET error', { error })
    return NextResponse.redirect(new URL('/auth/login?error=verification_error', request.url))
  }
}
