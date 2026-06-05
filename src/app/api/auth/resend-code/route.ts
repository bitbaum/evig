/**
 * Resend Verification Code API
 * POST /api/auth/resend-code
 *
 * Generates a new 6-digit verification code and sends it via email
 */

import { NextRequest } from 'next/server'
import { apiError, apiSuccess, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { getUserByEmail, createVerificationCode } from '@/lib/auth/db'
import { sendEmail } from '@/lib/email'
import { DEFAULT_USER_NAME_FALLBACK } from '@/config/auth-ui'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { validateBody, ResendCodeSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent abuse
    const clientIp = getClientIp(request.headers)
    const rateLimitResult = checkRateLimit(clientIp, 'register') // Use register rate limit

    if (!rateLimitResult.allowed) {
      logger.warn('Resend code rate limit exceeded', { ip: clientIp })
      return apiRateLimited(ERROR_MESSAGES.RATE_LIMITED, {
        retryAfter: rateLimitResult.retryAfter,
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      })
    }

    const body = await request.json()
    const validation = validateBody(ResendCodeSchema, body)
    if (!validation.success) return validation.error
    const { email } = validation.data

    // Check if user exists
    const user = await getUserByEmail(email)
    if (!user) {
      // Don't reveal if user exists - just return success
      logger.warn('Resend code attempted for non-existent email', { email })
      return apiSuccess({
        message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein neuer Code gesendet.',
      })
    }

    // Check if already verified
    if (user.emailVerified) {
      return apiBadRequest('Diese E-Mail-Adresse wurde bereits bestätigt.')
    }

    // Generate new code and send email
    try {
      const verificationCode = await createVerificationCode(email)
      const emailResult = await sendEmail(email, 'verificationCode', user.name || DEFAULT_USER_NAME_FALLBACK, verificationCode)
      if (!emailResult.success) {
        logger.error('Resend verification email returned failure', { error: emailResult.error, email, userId: user.id })
        return apiError(new Error(emailResult.error || 'Email send failed'), 'E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut.')
      }
      logger.info('Verification code resent', { email, userId: user.id })
    } catch (emailError) {
      logger.error('Failed to resend verification email', { error: emailError, email })
      return apiError(emailError, 'E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut.')
    }

    return apiSuccess({
      message: 'Ein neuer Bestätigungscode wurde an deine E-Mail-Adresse gesendet.',
    })
  } catch (error) {
    logger.error('Resend code error', { error })
    return apiError(error, ERROR_MESSAGES.UNEXPECTED_ERROR)
  }
}
