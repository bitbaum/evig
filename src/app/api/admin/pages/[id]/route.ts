import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getJwtSecret } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const REBOOT_CONTENT_URL = process.env.NEXT_PUBLIC_REBOOT_CONTENT_URL || 'http://localhost:3001'
const ENABLE_CMS = process.env.ENABLE_CMS === 'true'

interface User {
  id: string
  email: string
  role: string
}

function authenticateUser(): User {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) {
      throw new Error('Not authenticated')
    }

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
    throw new Error('Invalid token')
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!ENABLE_CMS) {
      return NextResponse.json({ error: 'CMS is disabled' }, { status: 501 })
    }
    const user = authenticateUser()

    // Forward to Reboot Content API
    const response = await fetch(`${REBOOT_CONTENT_URL}/api/content/static-pages/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${cookies().get('admin_token')?.value}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Page GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!ENABLE_CMS) {
      return NextResponse.json({ error: 'CMS is disabled' }, { status: 501 })
    }
    const user = authenticateUser()
    const body = await request.json()

    // Forward to Reboot Content API
    const response = await fetch(`${REBOOT_CONTENT_URL}/api/content/static-pages/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cookies().get('admin_token')?.value}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.error || 'Failed to update page' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Page PUT error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
