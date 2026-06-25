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

    // Send reset email.
    //
    // sendEmail() resolves { success: false } on SMTP / Listmonk failure
    // rather than throwing (see src/lib/email/index.ts:178). The previous
    // try/catch only caught actual rejections, so a silent send-failure
    // logged "Password reset email sent" (false positive) and the user
    // was locked out — generic "we sent you a link" response, no link
    // ever delivered. Inspect the resolved result AND keep a defensive
    // try/catch in case an unexpected throw escapes the email layer
    // (older callsites used to throw). Both paths log error and fall
    // through to the same generic success response — enumeration
    // protection requires not surfacing the failure to the caller.
    const resetUrl = getPasswordResetUrl(resetToken)
    let emailDelivered = false
    try {
      const sendResult = await sendEmail(
        email,
        'passwordReset',
        user.name || `${ORG.name} Benutzer`,
        resetUrl,
      )
      if (sendResult.success) {
        emailDelivered = true
        logger.info('Password reset email sent', { email })
      } else {
        logger.error('Failed to send password reset email (resolved)', {
          email,
          error: sendResult.error,
        })
      }
    } catch (emailError) {
      logger.error('Failed to send password reset email (rejected)', {
        error: emailError,
        email,
      })
    }

    if (!emailDelivered) {
      // User is known to exist (they submitted their own email). Surface
      // delivery failure so they are not stuck behind a false success message.
      return apiError(
        new Error('Password reset email not delivered'),
        'E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut oder kontaktiere uns unter kontakt@revamp-it.ch.',
        503,
      )
    }

    return apiSuccess({
      message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir einen Reset-Link gesendet.',
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}