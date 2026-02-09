/**
 * Reset Password API
 * POST /api/auth/reset-password
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyPasswordResetToken, updateUserPassword } from '@/lib/auth/db'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent brute force token guessing
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
    const { token, password } = body

    if (!token || !password) {
      return apiBadRequest('Token und Passwort sind erforderlich')
    }

    // Validate password strength
    const passwordCheck = validatePasswordStrength(password)
    if (!passwordCheck.isValid) {
      return apiBadRequest(
        'Das Passwort erfüllt nicht die Anforderungen',
        { password: passwordCheck.errors }
      )
    }

    // Verify token and get email
    const result = await verifyPasswordResetToken(token)
    if (!result.success) {
      return apiBadRequest(result.error || 'Ungültiger oder abgelaufener Token')
    }

    // Hash new password
    const passwordHash = await hashPassword(password)

    // Update user password
    const updateResult = await updateUserPassword(result.email!, passwordHash)
    if (!updateResult.success) {
      return apiError(
        new Error('Password update failed'),
        'Passwort konnte nicht aktualisiert werden'
      )
    }

    return apiSuccess({
      message: 'Passwort erfolgreich geändert',
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}