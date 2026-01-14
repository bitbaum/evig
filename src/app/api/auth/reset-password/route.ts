/**
 * Reset Password API
 * POST /api/auth/reset-password
 */

import { NextRequest } from 'next/server'
import { verifyPasswordResetToken, updateUserPassword } from '@/lib/auth/db'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'

export async function POST(request: NextRequest) {
  try {
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