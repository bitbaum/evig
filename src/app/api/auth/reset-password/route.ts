/**
 * Reset Password API
 * POST /api/auth/reset-password
 */

import { NextRequest } from 'next/server'
import { verifyPasswordResetToken, updateUserPassword } from '@/lib/auth/db'
import { hashPassword } from '@/lib/auth/password'
import { apiError, apiSuccess, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { validateBody, ResetPasswordSchema } from '@/lib/schemas'
import { sendCustomEmail, passwordChangeConfirmation } from '@/lib/email'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent brute force token guessing
    const clientIp = getClientIp(request.headers)
    const rateLimitResult = checkRateLimit(clientIp, 'passwordReset')

    if (!rateLimitResult.allowed) {
      logger.warn('Password reset rate limit exceeded', { ip: clientIp })
      return apiRateLimited('Zu viele Anfragen. Bitte versuchen Sie es später erneut.', {
        retryAfter: rateLimitResult.retryAfter,
      })
    }

    const body = await request.json()
    const validation = validateBody(ResetPasswordSchema, body)
    if (!validation.success) return validation.error
    const { token, password } = validation.data

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

    // Fire-and-forget: send password change confirmation email
    const userRows = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.email, result.email!.toLowerCase()))

    const userName = userRows[0]?.name || 'Benutzer'
    sendCustomEmail(result.email!, passwordChangeConfirmation(userName)).catch(err => {
      logger.warn('Failed to send password change confirmation email', { error: err, email: result.email })
    })

    return apiSuccess({
      message: 'Passwort erfolgreich geändert',
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}