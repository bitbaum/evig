import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getJwtSecret } from '@/lib/admin-auth'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { CMS_CONFIG } from '@/config/cms'

export const dynamic = 'force-dynamic'

const REBOOT_CONTENT_URL = CMS_CONFIG.URL
const ENABLE_CMS = CMS_CONFIG.ENABLED

interface User {
  id: string
  email: string
  role: string
}

async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) return null

    interface DecodedToken {
      userId: string;
      email: string;
      role: string;
    }

    const decoded = jwt.verify(
      token,
      getJwtSecret()
    ) as DecodedToken

    return {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    }
  } catch (error) {
    return null
  }
}

async function authenticateUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  return user
}

export async function GET(request: NextRequest) {
  try {
    if (!ENABLE_CMS) {
      return apiError(new Error('CMS is disabled'), 'CMS is disabled', 501)
    }
    const user = await authenticateUser()
    const cookieStore = await cookies()

    // Forward to Reboot Content API
    const response = await fetch(`${REBOOT_CONTENT_URL}/api/content/static-pages`, {
      headers: {
        'Authorization': `Bearer ${cookieStore.get('admin_token')?.value}`,
      },
    })

    if (!response.ok) {
      return apiError(
        new Error(`Failed to fetch pages: ${response.status}`),
        'Failed to fetch pages',
        response.status
      )
    }

    const data = await response.json()
    return apiSuccess(data)
  } catch (error) {
    return apiError(error, error instanceof Error ? error.message : 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!ENABLE_CMS) {
      return apiError(new Error('CMS is disabled'), 'CMS is disabled', 501)
    }
    const user = await authenticateUser()
    const body = await request.json()
    const cookieStore = await cookies()

    // Forward to Reboot Content API
    const response = await fetch(`${REBOOT_CONTENT_URL}/api/content/static-pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cookieStore.get('admin_token')?.value}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return apiError(
        new Error(errorData.error || 'Failed to create page'),
        errorData.error || 'Failed to create page',
        response.status
      )
    }

    const data = await response.json()
    return apiSuccess(data)
  } catch (error) {
    return apiError(error, error instanceof Error ? error.message : 'Internal server error')
  }
}
