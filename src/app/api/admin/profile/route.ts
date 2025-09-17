import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      JWT_SECRET!
    ) as any

    return NextResponse.json({
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
    })
  } catch (error) {
    console.error('Profile error:', error)
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }
}
