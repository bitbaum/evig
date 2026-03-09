import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { sendEmail } from '@/lib/email'
import { APP_URL } from '@/config/urls'
import { LISTMONK_CONFIG } from '@/config/email'
import { validateBody, NewsletterSubscribeSchema } from '@/lib/schemas'
import { db } from '@/db'
import { newsletterSubscriptions } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent subscription abuse
    const clientIp = getClientIp(request.headers)
    const rateLimitResult = checkRateLimit(clientIp, 'newsletter')

    if (!rateLimitResult.allowed) {
      logger.warn('Newsletter subscription rate limit exceeded', { ip: clientIp })
      return apiRateLimited('Zu viele Anfragen. Bitte versuchen Sie es später erneut.', {
        retryAfter: rateLimitResult.retryAfter,
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      })
    }

    const body = await request.json()
    const validation = validateBody(NewsletterSubscribeSchema, body)
    if (!validation.success) return validation.error

    const normalizedEmail = validation.data.email

    // Check for existing active subscriber
    const [existing] = await db
      .select({
        isActive: newsletterSubscriptions.isActive,
        confirmedAt: newsletterSubscriptions.confirmedAt,
      })
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, normalizedEmail))

    if (existing?.isActive && existing.confirmedAt) {
      return apiBadRequest('Diese E-Mail-Adresse ist bereits registriert')
    }

    const confirmToken = randomBytes(32).toString('hex')

    if (existing) {
      // Re-subscribe: update existing row with new token
      await db
        .update(newsletterSubscriptions)
        .set({
          isActive: false,
          confirmToken,
          confirmedAt: null,
          unsubscribedAt: null,
          source: body.source || 'website',
        })
        .where(eq(newsletterSubscriptions.email, normalizedEmail))
    } else {
      // New subscriber
      await db
        .insert(newsletterSubscriptions)
        .values({
          email: normalizedEmail,
          isActive: false,
          confirmToken,
          source: body.source || 'website',
        })
    }

    // Send confirmation email
    try {
      const confirmUrl = `${APP_URL}/api/newsletter/confirm?token=${confirmToken}`
      await sendEmail(normalizedEmail, 'newsletterConfirmation', confirmUrl)
      logger.info('Newsletter confirmation email sent', { email: normalizedEmail })
    } catch (emailError) {
      logger.warn('Failed to send newsletter confirmation email', {
        email: normalizedEmail,
        error: emailError
      })
    }

    // Sync to Listmonk if enabled
    if (process.env.LISTMONK_ENABLED === 'true') {
      const listmonkUrl = LISTMONK_CONFIG.URL
      const listmonkUser = LISTMONK_CONFIG.USERNAME
      const listmonkPassword = LISTMONK_CONFIG.PASSWORD
      const credentials = Buffer.from(`${listmonkUser}:${listmonkPassword}`).toString('base64')

      try {
        const lmResponse = await fetch(`${listmonkUrl}/api/subscribers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
          },
          body: JSON.stringify({
            email: normalizedEmail,
            name: normalizedEmail.split('@')[0],
            lists: [1],
            status: 'enabled',
            preconfirm_subscriptions: false,
            attribs: { source: body.source || 'website' },
          }),
        })

        if (!lmResponse.ok && lmResponse.status !== 409) {
          logger.warn('Listmonk sync failed', { status: lmResponse.status, email: normalizedEmail })
        } else {
          logger.info('Listmonk subscriber synced', { email: normalizedEmail })
        }
      } catch (lmError) {
        logger.warn('Listmonk sync error', { error: lmError, email: normalizedEmail })
      }
    }

    return apiSuccess({
      message: 'Bestätigungs-E-Mail gesendet',
    })
  } catch (error) {
    return apiError(error, 'Serverfehler. Bitte versuchen Sie es später erneut.')
  }
}

// Protected admin endpoint to view subscribers
export const GET = withAdmin(async (_request, _session) => {
  try {
    const rows = await db
      .select({
        email: newsletterSubscriptions.email,
        isActive: newsletterSubscriptions.isActive,
        confirmedAt: newsletterSubscriptions.confirmedAt,
        source: newsletterSubscriptions.source,
        createdAt: newsletterSubscriptions.createdAt,
      })
      .from(newsletterSubscriptions)
      .orderBy(desc(newsletterSubscriptions.createdAt))

    const active = rows.filter(s => s.isActive && s.confirmedAt).length
    const pending = rows.filter(s => !s.isActive && !s.confirmedAt).length

    return apiSuccess({
      total: rows.length,
      active,
      pending,
      subscribers: rows,
    })
  } catch (error) {
    return apiError(error, 'Abonnenten konnten nicht geladen werden')
  }
})
