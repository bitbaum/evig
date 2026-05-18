/**
 * User Registration API
 * POST /api/auth/register
 *
 * Includes rate limiting to prevent abuse
 */

import { NextRequest } from 'next/server'
import { registerUser } from '@/auth'
import { apiError, apiSuccess, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { RegisterSchema } from '@/lib/schemas'
import { redeemReferralCode } from '@/lib/referral'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent registration abuse
    const clientIp = getClientIp(request.headers)
    const rateLimitResult = checkRateLimit(clientIp, 'register')

    if (!rateLimitResult.allowed) {
      logger.warn('Registration rate limit exceeded', { ip: clientIp })
      return apiRateLimited(ERROR_MESSAGES.RATE_LIMITED_REGISTRATION, {
        retryAfter: rateLimitResult.retryAfter,
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      })
    }

    const body = await request.json()

    // Validate input with Zod schema
    const validationResult = RegisterSchema.safeParse(body)
    if (!validationResult.success) {
      return apiBadRequest(ERROR_MESSAGES.VALIDATION_FAILED, validationResult.error.flatten().fieldErrors)
    }

    const { email, password, name, role, referralCode } = validationResult.data

    try {
      const result = await registerUser({ email, password, name, role })

      if (!result.success) {
        return apiBadRequest(
          result.error || 'Registration failed',
          result.errors ? { validation: result.errors } : undefined
        )
      }

      if (referralCode && result.data?.userId) {
        redeemReferralCode(referralCode, result.data.userId, email, name ?? email).catch(err =>
          logger.error('Referral redemption failed', { referralCode, userId: result.data!.userId, error: err })
        )
      }

      return apiSuccess(result.data)
    } catch (dbError) {
      // Handle database connection errors gracefully
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)
      if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
        logger.error('Database connection failed during registration', { error: dbError })
        return apiError(
          new Error('Database connection failed'),
          ERROR_MESSAGES.DB_CONNECTION_FAILED,
          503
        )
      }
      throw dbError
    }
  } catch (error) {
    logger.error('Registration error', { error })
    return apiError(error, ERROR_MESSAGES.UNEXPECTED_ERROR)
  }
}
