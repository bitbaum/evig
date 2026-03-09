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
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'

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
    const { rows: existing } = await query<{ is_active: boolean; confirmed_at: string | null }>(
      `SELECT is_active, confirmed_at FROM ${TABLE_NAMES.NEWSLETTER_SUBSCRIPTIONS} WHERE email = $1`,
      [normalizedEmail]
    )

    if (existing.length > 0 && existing[0].is_active && existing[0].confirmed_at) {
      return apiBadRequest('Diese E-Mail-Adresse ist bereits registriert')
    }

    const confirmToken = randomBytes(32).toString('hex')

    if (existing.length > 0) {
      // Re-subscribe: update existing row with new token
      await query(
        `UPDATE ${TABLE_NAMES.NEWSLETTER_SUBSCRIPTIONS}
         SET is_active = false, confirm_token = $1, confirmed_at = NULL, unsubscribed_at = NULL, source = $2
         WHERE email = $3`,
        [confirmToken, body.source || 'website', normalizedEmail]
      )
    } else {
      // New subscriber
      await query(
        `INSERT INTO ${TABLE_NAMES.NEWSLETTER_SUBSCRIPTIONS} (email, is_active, confirm_token, source)
         VALUES ($1, false, $2, $3)`,
        [normalizedEmail, confirmToken, body.source || 'website']
      )
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
    const { rows } = await query<{
      email: string
      is_active: boolean
      confirmed_at: string | null
      source: string | null
      created_at: string
    }>(
      `SELECT email, is_active, confirmed_at, source, created_at
       FROM ${TABLE_NAMES.NEWSLETTER_SUBSCRIPTIONS}
       ORDER BY created_at DESC`
    )

    const active = rows.filter(s => s.is_active && s.confirmed_at).length
    const pending = rows.filter(s => !s.is_active && !s.confirmed_at).length

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
