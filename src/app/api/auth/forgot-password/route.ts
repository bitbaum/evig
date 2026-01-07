/**
 * Forgot Password API
 * POST /api/auth/forgot-password
 */

import { Request } from 'next/server'
import { getUserByEmail, createPasswordResetToken } from '@/lib/auth/db'
import { sendEmail } from '@/lib/email'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/config/error-messages'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return apiBadRequest(ERROR_MESSAGES.EMAIL_REQUIRED)
    }

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