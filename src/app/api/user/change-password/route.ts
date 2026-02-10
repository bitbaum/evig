/**
 * Change Password API
 * POST /api/user/change-password
 */

import { NextRequest } from 'next/server'
import { verifyPassword, hashPassword } from '@/lib/auth/password'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { withAuth } from '@/lib/api/middleware'
import { TABLE_NAMES } from '@/config/database'
import { query } from '@/lib/auth/db'
import { validateBody, ChangePasswordSchema } from '@/lib/schemas'

export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    const body = await request.json()
    const validation = validateBody(ChangePasswordSchema, body)
    if (!validation.success) return validation.error
    const { currentPassword, newPassword } = validation.data

    // Fetch current password hash from database
    const userResult = await query(
      `SELECT password_hash FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [session.user.id]
    )

    if (userResult.rows.length === 0) {
      return apiBadRequest('Benutzer nicht gefunden')
    }

    const user = userResult.rows[0] as { password_hash: string }

    if (!user.password_hash) {
      return apiBadRequest('Kein Passwort gesetzt. Bitte verwenden Sie die Passwort-zurücksetzen Funktion.')
    }

    // Verify current password against stored hash
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash)
    if (!isCurrentPasswordValid) {
      return apiBadRequest('Das aktuelle Passwort ist falsch')
    }

    // Prevent setting the same password
    const isSamePassword = await verifyPassword(newPassword, user.password_hash)
    if (isSamePassword) {
      return apiBadRequest('Das neue Passwort muss sich vom aktuellen Passwort unterscheiden')
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password in database
    await query(
      `UPDATE ${TABLE_NAMES.USERS} SET password_hash = $1, "updatedAt" = NOW() WHERE id = $2`,
      [newPasswordHash, session.user.id]
    )

    return apiSuccess({
      message: 'Passwort erfolgreich geändert',
    })
  } catch (error) {
    return apiError(error, 'Passwort konnte nicht geändert werden')
  }
})






