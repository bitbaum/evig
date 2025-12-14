/**
 * Forgot Password API
 * POST /api/auth/forgot-password
 */

import { NextResponse } from 'next/server'
import { getUserByEmail, createPasswordResetToken } from '@/lib/auth/db'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'E-Mail-Adresse ist erforderlich' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await getUserByEmail(email)
    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Reset-Link gesendet.',
      })
    }

    // Create reset token
    const resetToken = await createPasswordResetToken(email)

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/auth/reset-password?token=${resetToken}`
    try {
      await sendEmail(email, 'passwordReset', user.name || 'RevampIT Benutzer', resetUrl)
      console.log('Password reset email sent to:', email)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      // Still return success for security (don't reveal email issues)
    }

    return NextResponse.json({
      success: true,
      message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Reset-Link gesendet.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}