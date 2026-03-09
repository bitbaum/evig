/**
 * Change Password API
 * POST /api/user/change-password
 */

import { NextRequest } from 'next/server'
import { verifyPassword, hashPassword } from '@/lib/auth/password'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { withAuth } from '@/lib/api/middleware'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { validateBody, ChangePasswordSchema } from '@/lib/schemas'

export const POST = withAuth(async (request: NextRequest, session) => {
  try {
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
      return apiBadRequest('Benutzer nicht gefunden')
    }

    if (!user.passwordHash) {
      return apiBadRequest('Kein Passwort gesetzt. Bitte verwenden Sie die Passwort-zurücksetzen Funktion.')
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
