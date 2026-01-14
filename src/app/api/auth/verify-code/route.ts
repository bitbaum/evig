/**
 * Email Verification Code API
 * POST /api/auth/verify-code
 *
 * Verifies a 6-digit email verification code
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { verifyEmailCode } from '@/lib/auth/db'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent brute force attacks
    const clientIp = getClientIp(request.headers)
    const rateLimitResult = checkRateLimit(clientIp, 'login') // Use login rate limit for verification

    if (!rateLimitResult.allowed) {
      logger.warn('Verification rate limit exceeded', { ip: clientIp })
      return NextResponse.json(
        {
          success: false,
          error: 'Zu viele Versuche. Bitte versuchen Sie es später erneut.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetAt),
          },
        }
      )
    }

    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return apiBadRequest('E-Mail und Code sind erforderlich')
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return apiBadRequest('Ungültiges Code-Format')
    }

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
