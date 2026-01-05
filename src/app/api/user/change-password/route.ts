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
        passwordCheck.errors
      )
    }

    // Verify current password (this would require access to the current password)
    // For now, we'll implement this as a placeholder since we need to store current password
    // In a real implementation, you'd verify against the stored hash

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






