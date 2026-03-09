import { NextRequest } from 'next/server'
import { getUserByEmail, query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { apiSuccess, apiBadRequest, apiError, apiRateLimited } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { createRateLimiter, getClientIdentifier } from '@/lib/security/rate-limit'

const loginStatusLimiter = createRateLimiter(60 * 1000, 10) // 10 requests/minute per IP

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req)
    if (!loginStatusLimiter(clientId)) {
      return apiRateLimited('Zu viele Anfragen. Bitte versuchen Sie es später erneut.')
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
        const res = await query<{ locked_until: Date | null }>(
          `SELECT locked_until FROM ${TABLE_NAMES.USER_LOCKOUTS} WHERE user_id = $1`,
          [user.id]
        )
        const rec = res.rows[0]
        if (rec?.locked_until && new Date(rec.locked_until) > new Date()) {
          locked = true
          lockedUntil = new Date(rec.locked_until).toISOString()
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
        return apiError(dbError, 'Datenbankverbindung fehlgeschlagen. Bitte versuchen Sie es später erneut.', 503)
      }
      throw dbError
    }
  } catch (e) {
    return apiError(e, ERROR_MESSAGES.STATUS_CHECK_FAILED)
  }
}
