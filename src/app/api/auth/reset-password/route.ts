/**
 * Reset Password API
 * POST /api/auth/reset-password
 */

import { NextResponse } from 'next/server'
import { verifyPasswordResetToken, updateUserPassword } from '@/lib/auth/db'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token und Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordCheck = validatePasswordStrength(password)
    if (!passwordCheck.isValid) {
      return NextResponse.json(
        { error: 'Das Passwort erfüllt nicht die Anforderungen', errors: passwordCheck.errors },
        { status: 400 }
      )
    }

    // Verify token and get email
    const result = await verifyPasswordResetToken(token)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Ungültiger oder abgelaufener Token' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(password)

    // Update user password
    const updateResult = await updateUserPassword(result.email!, passwordHash)
    if (!updateResult.success) {
      return NextResponse.json(
        { error: 'Passwort konnte nicht aktualisiert werden' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Passwort erfolgreich geändert',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}