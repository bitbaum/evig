import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailWithToken } from '@/lib/auth/db'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token ist erforderlich' },
        { status: 400 }
      )
    }

    const result = await verifyEmailWithToken(token)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Send welcome email
    try {
      const userResult = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Note: This would need proper authentication in a real implementation
        }
      })

      if (userResult.ok) {
        const userData = await userResult.json()
        const userName = userData.first_name || userData.last_name || 'RevampIT Benutzer'
        await sendEmail(result.email!, 'welcome', userName)
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the verification if welcome email fails
    }

    return NextResponse.json({
      success: true,
      message: 'E-Mail-Adresse erfolgreich bestätigt! Sie können sich jetzt anmelden.',
    })
  } catch (error) {
    console.error('Email verification API error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/auth/login?error=invalid_token', request.url))
    }

    const result = await verifyEmailWithToken(token)

    if (!result.success) {
      return NextResponse.redirect(new URL('/auth/login?error=verification_failed', request.url))
    }

    // Send welcome email
    try {
      // Get user info for personalized welcome email
      // This is a simplified approach - in production you'd want to get user details
      await sendEmail(result.email!, 'welcome', 'RevampIT Benutzer')
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
    }

    // Redirect to login with success message
    return NextResponse.redirect(new URL('/auth/login?verified=true', request.url))
  } catch (error) {
    console.error('Email verification GET error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=verification_error', request.url))
  }
}





