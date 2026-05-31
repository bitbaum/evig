import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailWithToken } from '@/lib/auth/db'
import { sendCustomEmail, staffWelcome, welcome } from '@/lib/email'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateBody, VerifyEmailTokenSchema } from '@/lib/schemas'
import { isStaffEmail } from '@/lib/permissions'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateBody(VerifyEmailTokenSchema, body)
    if (!validation.success) return validation.error
    const { token } = validation.data

    const result = await verifyEmailWithToken(token)

    if (!result.success) {
      return apiBadRequest(result.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
    }

    // Fire-and-forget: send welcome email (staff or regular)
    const userRows = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.email, result.email!.toLowerCase()))

    const userName = userRows[0]?.name || 'Benutzer'
    const emailContent = isStaffEmail(result.email!)
      ? staffWelcome(userName)
      : welcome(userName)

    // sendCustomEmail resolves {success:false} on SMTP failure rather
    // than throwing; bare-catch misses that mode. Same fix class.
    sendCustomEmail(result.email!, emailContent)
      .then(r => {
        if (!r.success) {
          logger.warn('Failed to send welcome email after verification (resolved)', { error: r.error, email: result.email })
        }
      })
      .catch(err => {
        logger.warn('Failed to send welcome email after verification (rejected)', { error: err, email: result.email })
      })

    return apiSuccess({
      message: 'E-Mail-Adresse erfolgreich bestätigt! Du kannst dich jetzt anmelden.',
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/auth/login?error=invalid_token', request.url))
    }

    const result = await verifyEmailWithToken(token)

    if (!result.success) {
      return NextResponse.redirect(new URL('/auth/login?error=verification_failed', request.url))
    }

    // Fire-and-forget: send welcome email (staff or regular)
    const getUserRows = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.email, result.email!.toLowerCase()))

    const getUserName = getUserRows[0]?.name || 'Benutzer'
    const getEmailContent = isStaffEmail(result.email!)
      ? staffWelcome(getUserName)
      : welcome(getUserName)

    sendCustomEmail(result.email!, getEmailContent)
      .then(r => {
        if (!r.success) {
          logger.warn('Failed to send welcome email after verification (resolved)', { error: r.error, email: result.email })
        }
      })
      .catch(err => {
        logger.warn('Failed to send welcome email after verification (rejected)', { error: err, email: result.email })
      })

    // Redirect to login with success message
    return NextResponse.redirect(new URL('/auth/login?verified=true', request.url))
  } catch (error) {
    logger.error('Email verification GET error', { error })
    return NextResponse.redirect(new URL('/auth/login?error=verification_error', request.url))
  }
}
