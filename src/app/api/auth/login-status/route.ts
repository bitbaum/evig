import { NextRequest } from 'next/server'
import { getUserByEmail } from '@/lib/auth/db'
import { db } from '@/db'
import { userLockouts } from '@/db/schema/auth'
import { eq } from 'drizzle-orm'
import { apiSuccess, apiBadRequest, apiError, apiRateLimited } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { createRateLimiter, getClientIdentifier } from '@/lib/security/rate-limit'

const loginStatusLimiter = createRateLimiter(60 * 1000, 10) // 10 requests/minute per IP

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req)
    if (!loginStatusLimiter(clientId)) {
      return apiRateLimited()
    }

    const { email } = await req.json()
    if (!email) {
      return apiBadRequest(ERROR_MESSAGES.EMAIL_REQUIRED)
    }

    try {
      const user = await getUserByEmail(email)
      if (!user) {
        return apiSuccess({
          exists: false,
          reason: 'EMAIL_NOT_FOUND'
        })
      }

      // Check lockout (DB-backed)
      let locked = false
      let lockedUntil: string | null = null
      try {
        const [lockout] = await db
          .select({ lockedUntil: userLockouts.lockedUntil })
          .from(userLockouts)
          .where(eq(userLockouts.userId, user.id))

        if (lockout?.lockedUntil && new Date(lockout.lockedUntil) > new Date()) {
          locked = true
          lockedUntil = new Date(lockout.lockedUntil).toISOString()
        }
      } catch {
        // Lockout table might not exist, ignore
      }

      return apiSuccess({
        exists: true,
        emailVerified: !!user.emailVerified,
        hasPassword: !!user.password_hash,
        locked,
        lockedUntil,
      })
    } catch (dbError) {
      // Handle database connection errors gracefully
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)
      if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
        return apiError(dbError, ERROR_MESSAGES.DB_CONNECTION_FAILED, 503)
      }
      throw dbError
    }
  } catch (e) {
    return apiError(e, ERROR_MESSAGES.STATUS_CHECK_FAILED)
  }
}
