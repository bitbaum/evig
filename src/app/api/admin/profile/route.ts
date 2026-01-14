import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getJwtSecret } from '@/lib/admin-auth'
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) {
      return apiUnauthorized('Not authenticated')
    }

    // Verify JWT
    interface DecodedToken {
      userId: string;
      email: string;
      role: string;
    }

    const decoded = jwt.verify(
      token,
      getJwtSecret()
    ) as DecodedToken

    return apiSuccess({
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
    })
  } catch (error) {
    return apiError(error, 'Invalid token', 401)
  }
}
