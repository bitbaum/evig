/**
 * Change Password API
 * POST /api/user/change-password
 */

import { NextRequest } from 'next/server'
import { verifyPassword, hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { withAuth } from '@/lib/api/middleware'
import { TABLE_NAMES } from '@/config/database'
import { query } from '@/lib/auth/db'

export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return apiBadRequest('Alle Passwortfelder sind erforderlich')
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      return apiBadRequest('Die neuen Passwörter stimmen nicht überein')
    }

    // Validate password strength
    const passwordCheck = validatePasswordStrength(newPassword)
    if (!passwordCheck.isValid) {
      return apiBadRequest(
        'Das neue Passwort erfüllt nicht die Anforderungen',
        { password: passwordCheck.errors }
      )
    }

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






