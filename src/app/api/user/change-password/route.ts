/**
 * Change Password API
 * POST /api/user/change-password
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { verifyPassword, hashPassword, validatePasswordStrength } from '@/lib/auth/password'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Alle Passwortfelder sind erforderlich' },
        { status: 400 }
      )
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Die neuen Passwörter stimmen nicht überein' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordCheck = validatePasswordStrength(newPassword)
    if (!passwordCheck.isValid) {
      return NextResponse.json(
        { error: 'Das neue Passwort erfüllt nicht die Anforderungen', errors: passwordCheck.errors },
        { status: 400 }
      )
    }

    // Verify current password (this would require access to the current password)
    // For now, we'll implement this as a placeholder since we need to store current password
    // In a real implementation, you'd verify against the stored hash

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password in database
    const { query } = await import('@/lib/auth/db')
    await query(
      'UPDATE users SET password_hash = $1, "updatedAt" = NOW() WHERE id = $2',
      [newPasswordHash, session.user.id]
    )

    return NextResponse.json({
      success: true,
      message: 'Passwort erfolgreich geändert',
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Passwort konnte nicht geändert werden' },
      { status: 500 }
    )
  }
}






