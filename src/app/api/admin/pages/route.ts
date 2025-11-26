import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getJwtSecret } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const REBOOT_CONTENT_URL = process.env.NEXT_PUBLIC_REBOOT_CONTENT_URL || 'http://localhost:3001'

interface User {
  id: string
  email: string
  role: string
}

function getCurrentUser(): User | null {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) return null

    const decoded = jwt.verify(
      token,
      getJwtSecret()
    ) as any

    return {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    }
  } catch (error) {
    return null
  }
}

function authenticateUser(): User {
  const user = getCurrentUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  return user
}

export async function GET(request: NextRequest) {
  try {
    const user = authenticateUser()

    // Forward to Reboot Content API
    const response = await fetch(`${REBOOT_CONTENT_URL}/api/content/static-pages`, {
      headers: {
        'Authorization': `Bearer ${cookies().get('admin_token')?.value}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch pages' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Pages GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = authenticateUser()
    const body = await request.json()

    // Forward to Reboot Content API
    const response = await fetch(`${REBOOT_CONTENT_URL}/api/content/static-pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cookies().get('admin_token')?.value}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.error || 'Failed to create page' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Pages POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
