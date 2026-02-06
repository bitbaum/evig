/**
 * User Registration API
 * POST /api/auth/register
 *
 * Includes rate limiting to prevent abuse
 */

import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/auth'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { RegisterSchema, formatZodErrors, ZodError } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent registration abuse
    const clientIp = getClientIp(request.headers)
    const rateLimitResult = checkRateLimit(clientIp, 'register')

    if (!rateLimitResult.allowed) {
      logger.warn('Registration rate limit exceeded', { ip: clientIp })
      return NextResponse.json(
        {
          success: false,
          error: 'Zu viele Registrierungsversuche. Bitte versuchen Sie es später erneut.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetAt),
          },
        }
      )
    }

    const body = await request.json()

    // Validate input with Zod schema
    const validationResult = RegisterSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validierung fehlgeschlagen',
          errors: formatZodErrors(validationResult.error),
        },
        { status: 400 }
      )
    }

    const { email, password, name, role } = validationResult.data

    try {
      const result = await registerUser({ email, password, name, role })

      if (!result.success) {
        return apiBadRequest(
          result.error || 'Registration failed',
          result.errors ? { validation: result.errors } : undefined
        )
      }

      return apiSuccess({
        message: 'Konto erfolgreich erstellt. Bitte bestätigen Sie Ihre E-Mail-Adresse.',
        data: result.data,
      })
    } catch (dbError) {
      // Handle database connection errors gracefully
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)
      if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
        logger.error('Database connection failed during registration', { error: dbError })
        return apiError(
          new Error('Database connection failed'),
          'Datenbankverbindung fehlgeschlagen. Bitte versuchen Sie es später erneut.',
          503
        )
      }
      throw dbError
    }
  } catch (error) {
    logger.error('Registration error', { error })
    return apiError(error, 'Ein unerwarteter Fehler ist aufgetreten')
  }
}


