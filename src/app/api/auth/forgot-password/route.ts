/**
 * Forgot Password API
 * POST /api/auth/forgot-password
 */

import { NextRequest } from 'next/server'
import { getUserByEmail, createPasswordResetToken } from '@/lib/auth/db'
import { sendEmail } from '@/lib/email'
import { apiError, apiSuccess, apiRateLimited } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { validateBody, ForgotPasswordSchema } from '@/lib/schemas'
import { ORG } from '@/config/org'
import { getPasswordResetUrl } from '@/config/urls'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent password reset abuse
    const clientIp = getClientIp(request.headers)
    const rateLimitResult = checkRateLimit(clientIp, 'passwordReset')

    if (!rateLimitResult.allowed) {
      logger.warn('Password reset rate limit exceeded', { ip: clientIp })
      return apiRateLimited(ERROR_MESSAGES.RATE_LIMITED, {
        retryAfter: rateLimitResult.retryAfter,
      })
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
        message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir einen Reset-Link gesendet.',
      })
    }

    // Create reset token
    const resetToken = await createPasswordResetToken(email)

    // Send reset email
    const resetUrl = getPasswordResetUrl(resetToken)
    try {
      await sendEmail(email, 'passwordReset', user.name || `${ORG.name} Benutzer`, resetUrl)
      logger.info('Password reset email sent', { email })
    } catch (emailError) {
      logger.error('Failed to send password reset email', { error: emailError, email })
      // Still return success for security (don't reveal email issues)
    }

    return apiSuccess({
      message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir einen Reset-Link gesendet.',
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}