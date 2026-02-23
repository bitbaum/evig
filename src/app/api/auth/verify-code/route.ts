/**
 * Email Verification Code API
 * POST /api/auth/verify-code
 *
 * Verifies a 6-digit email verification code
 */

import { NextRequest } from 'next/server'
import { apiError, apiSuccess, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { verifyEmailCode } from '@/lib/auth/db'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { validateBody, VerifyCodeSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent brute force attacks
    const clientIp = getClientIp(request.headers)
    const rateLimitResult = checkRateLimit(clientIp, 'login') // Use login rate limit for verification

    if (!rateLimitResult.allowed) {
      logger.warn('Verification rate limit exceeded', { ip: clientIp })
      return apiRateLimited('Zu viele Versuche. Bitte versuchen Sie es später erneut.', {
        retryAfter: rateLimitResult.retryAfter,
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      })
    }

    const body = await request.json()
    const validation = validateBody(VerifyCodeSchema, body)
    if (!validation.success) return validation.error
    const { email, code } = validation.data

    const result = await verifyEmailCode(email, code)

    if (!result.success) {
      return apiBadRequest(result.error || 'Verifizierung fehlgeschlagen')
    }

    logger.info('Email verified successfully', { email })

    return apiSuccess({
      message: 'E-Mail-Adresse erfolgreich bestätigt',
      verified: true,
    })
  } catch (error) {
    logger.error('Verification error', { error })
    return apiError(error, 'Ein unerwarteter Fehler ist aufgetreten')
  }
}
