import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@/lib/admin-auth'

const REBOOT_CONTENT_URL = process.env.NEXT_PUBLIC_REBOOT_CONTENT_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Forward login request to Reboot Content API
    const response = await fetch(`${REBOOT_CONTENT_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.error || 'Invalid credentials' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Create our own JWT for the admin interface
    const token = jwt.sign(
      {
        userId: data.user.id,
        email: data.user.email,
        role: data.user.role,
      },
      JWT_SECRET!,
      { expiresIn: '24h' }
    )

    // Set HTTP-only cookie with the JWT
    const cookieStore = cookies()
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: data.user,
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
