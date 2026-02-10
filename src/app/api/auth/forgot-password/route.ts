/**
 * Forgot Password API
 * POST /api/auth/forgot-password
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, createPasswordResetToken } from '@/lib/auth/db'
import { sendEmail } from '@/lib/email'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { validateBody, ForgotPasswordSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent password reset abuse
    const clientIp = getClientIp(request.headers)
    const rateLimitResult = checkRateLimit(clientIp, 'passwordReset')

    if (!rateLimitResult.allowed) {
      logger.warn('Password reset rate limit exceeded', { ip: clientIp })
      return NextResponse.json(
        {
          success: false,
          error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          },
        }
      )
    }

    const body = await request.json()
    const validation = validateBody(ForgotPasswordSchema, body)
    if (!validation.success) return validation.error
    const { email } = validation.data

    // Check if user exists
    const user = await getUserByEmail(email)
    if (!user) {
      // Don't reveal if email exists or not for security
      return apiSuccess({
        message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Reset-Link gesendet.',
      })
    }

    // Create reset token
    const resetToken = await createPasswordResetToken(email)

    // Send reset email
    const { getPasswordResetUrl } = require('@/config/urls')
    const resetUrl = getPasswordResetUrl(resetToken)
    try {
      await sendEmail(email, 'passwordReset', user.name || 'RevampIT Benutzer', resetUrl)
      logger.info('Password reset email sent', { email })
    } catch (emailError) {
      logger.error('Failed to send password reset email', { error: emailError, email })
      // Still return success for security (don't reveal email issues)
    }

    return apiSuccess({
      message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Reset-Link gesendet.',
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}