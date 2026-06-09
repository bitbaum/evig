import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { auth } from '@/auth'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
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
      return apiRateLimited(ERROR_MESSAGES.RATE_LIMITED, {
        retryAfter: rateLimitResult.retryAfter,
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      })
    }

    const body = await request.json()
    const validation = validateBody(NewsletterSubscribeSchema, body)
    if (!validation.success) return validation.error

    const normalizedEmail = validation.data.email
    const subscriberName = validation.data.name
    const confirmToken = randomBytes(32).toString('hex')
    const source = validation.data.source ?? 'website'

    // Atomic upsert avoids the check-then-act race: the prior pattern (SELECT
    // then UPDATE-or-INSERT) could 500 with a UNIQUE violation when two
    // concurrent requests for the same email both saw `existing=null`. The
    // ON CONFLICT branch also lets us detect already-confirmed subscribers in
    // a single round trip via RETURNING.
    const [row] = await db
      .insert(newsletterSubscriptions)
      .values({
        email: normalizedEmail,
        isActive: false,
        confirmToken,
        source,
      })
      .onConflictDoUpdate({
        target: newsletterSubscriptions.email,
        set: {
          isActive: false,
          confirmToken,
          confirmedAt: null,
          unsubscribedAt: null,
          source,
        },
        // Skip the overwrite when the row is already confirmed + active —
        // we want to surface "already registered" instead.
        setWhere: sql`${newsletterSubscriptions.isActive} = false OR ${newsletterSubscriptions.confirmedAt} IS NULL`,
      })
      .returning({
        isActive: newsletterSubscriptions.isActive,
        confirmedAt: newsletterSubscriptions.confirmedAt,
      })

    if (!row) {
      // setWhere blocked the update — the existing row is confirmed + active.
      return apiBadRequest('Diese E-Mail-Adresse ist bereits registriert')
    }

    // Fast-path: if the signed-in user is subscribing with their own
    // already-authenticated email, double-opt-in is theatre. We've
    // already verified ownership at sign-in. Confirm in-place and skip
    // the confirmation email entirely — that removes the dependency on
    // SMTP/Listmonk config for the most common case (a logged-in user
    // clicking "follow this project").
    const session = await auth()
    const sessionEmail = session?.user?.email?.toLowerCase()
    if (sessionEmail && sessionEmail === normalizedEmail) {
      await db
        .update(newsletterSubscriptions)
        .set({
          isActive: true,
          confirmedAt: sql`NOW()`,
          confirmToken: null,
        })
        .where(eq(newsletterSubscriptions.email, normalizedEmail))
      logger.info('Newsletter auto-confirmed for signed-in subscriber', {
        email: normalizedEmail, source,
      })
      return apiSuccess({ confirmed: true, message: 'Erfolgreich angemeldet' })
    }

    // Anonymous (or different email): try to send the confirmation. If
    // sending fails we DON'T return an error — the DB insert already
    // succeeded, so degrading silently is the honest UX. The pending
    // row is visible to admins via the GET endpoint below, so staff
    // can confirm manually if the email backend stays broken. A scary
    // "Bestätigungs-E-Mail konnte nicht gesendet werden" 502 (which the
    // user could not act on) was the user-visible bug we're fixing here.
    const confirmUrl = `${APP_URL}/api/newsletter/confirm?token=${confirmToken}`
    const emailResult = await sendEmail(normalizedEmail, 'newsletterConfirmation', confirmUrl)
    if (!emailResult.success) {
      logger.warn('Failed to send newsletter confirmation email — recorded as pending', {
        email: normalizedEmail,
        error: emailResult.error,
      })
    } else {
      logger.info('Newsletter confirmation email sent', { email: normalizedEmail })
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
            name: subscriberName ?? normalizedEmail.split('@')[0],
            lists: [1],
            status: 'enabled',
            preconfirm_subscriptions: false,
            attribs: { source },
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
      confirmed: false,
      message: emailResult.success
        ? 'Bestätigungs-E-Mail gesendet'
        : 'Anmeldung registriert — Bestätigung folgt',
    })
  } catch (error) {
    return apiError(error, 'Serverfehler. Bitte versuche es später erneut.')
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
