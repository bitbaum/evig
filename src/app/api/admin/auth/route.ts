import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword, createAdminToken, createAuthCookie, clearAuthCookie } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password, action } = body

    // Handle logout
    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
      response.headers.set('Set-Cookie', clearAuthCookie())
      return response
    }

    // Handle login
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = createAdminToken()
    
    // Create response with auth cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        email: 'admin@revampit.ch',
        role: 'admin'
      }
    })

    response.headers.set('Set-Cookie', createAuthCookie(token))
    
    return response

  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie')
    const { getTokenFromCookies, verifyAdminToken } = await import('@/lib/admin-auth')
    
    const token = getTokenFromCookies(cookieHeader || undefined)
    
    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    const adminUser = verifyAdminToken(token)
    
    if (!adminUser) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json({ 
      authenticated: true,
      user: {
        email: adminUser.email,
        role: adminUser.role
      }
    })

  } catch (error) {
    console.error('Admin auth check error:', error)
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    )
  }
}