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
      return apiRateLimited(ERROR_MESSAGES.RATE_LIMITED, {
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

    // Fire-and-forget: send password change confirmation email.
    //
    // sendCustomEmail RESOLVES `{success:false}` on SMTP / Listmonk
    // failure rather than throwing — a bare `.catch()` only catches
    // actual rejections, so resolved-failures slip through silently.
    // This is the password-recovery flow: a silent send means the user
    // never gets the "your password was changed" confirmation and may
    // wonder whether the reset went through (support burden). Same fix
    // shape as a4f2d601 (dropoff) and 7ef4fd75 (inquiry).
    const userRows = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.email, result.email!.toLowerCase()))

    const userName = userRows[0]?.name || 'Benutzer'
    sendCustomEmail(result.email!, passwordChangeConfirmation(userName))
      .then(r => {
        if (!r.success) {
          logger.warn('Failed to send password change confirmation email (resolved)', { error: r.error, email: result.email })
        }
      })
      .catch(err => {
        logger.warn('Failed to send password change confirmation email (rejected)', { error: err, email: result.email })
      })

    return apiSuccess({
      message: 'Passwort erfolgreich geändert',
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}