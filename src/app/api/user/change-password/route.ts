/**
 * Change Password API
 * POST /api/user/change-password
 */

import { NextRequest } from 'next/server'
import { verifyPassword, hashPassword } from '@/lib/auth/password'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { withAuth } from '@/lib/api/middleware'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { validateBody, ChangePasswordSchema } from '@/lib/schemas'
import { rateLimiters } from '@/lib/security/rate-limit'

export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    // Rate-limit current-password attempts. Endpoint returns a distinct error
    // for wrong current password (line 40), so without a cap a session-
    // hijacker can brute-force the real password unlimited times. 5/hour is
    // generous for typos and tight enough to make guessing impractical.
    if (!rateLimiters.passwordChange(`${session.user.id}:change-password`)) {
      return apiBadRequest('Zu viele Passwort-Änderungsversuche. Bitte warte 1 Stunde.')
    }

    const body = await request.json()
    const validation = validateBody(ChangePasswordSchema, body)
    if (!validation.success) return validation.error
    const { currentPassword, newPassword } = validation.data

    // Fetch current password hash from database
    const [user] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, session.user.id))

    if (!user) {
      return apiBadRequest(ERROR_MESSAGES.USER_NOT_FOUND)
    }

    if (!user.passwordHash) {
      return apiBadRequest('Kein Passwort gesetzt. Bitte verwende die Passwort-zurücksetzen Funktion.')
    }

    // Verify current password against stored hash
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash)
    if (!isCurrentPasswordValid) {
      return apiBadRequest('Das aktuelle Passwort ist falsch')
    }

    // Prevent setting the same password
    const isSamePassword = await verifyPassword(newPassword, user.passwordHash)
    if (isSamePassword) {
      return apiBadRequest('Das neue Passwort muss sich vom aktuellen Passwort unterscheiden')
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password in database
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: sql`NOW()`,
      })
      .where(eq(users.id, session.user.id))

    return apiSuccess({
      message: 'Passwort erfolgreich geändert',
    })
  } catch (error) {
    return apiError(error, 'Passwort konnte nicht geändert werden')
  }
})
