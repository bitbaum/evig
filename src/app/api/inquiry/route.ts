import { NextRequest } from 'next/server'
import { apiError, apiSuccess, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { z } from 'zod'
import { sendCustomEmail } from '@/lib/email'
import { inquiryNotification, inquiryConfirmation } from '@/lib/email/templates/inquiry'
import { CONTACT } from '@/config/org'

const InquirySchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(200),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  message: z.string().min(20, 'Nachricht muss mindestens 20 Zeichen haben').max(2000),
  topic: z.string().min(1).max(100),
})

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request.headers)
    const rateLimit = checkRateLimit(clientIp, 'submission')
    if (!rateLimit.allowed) {
      return apiRateLimited(ERROR_MESSAGES.RATE_LIMITED, {
        retryAfter: rateLimit.retryAfter,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      })
    }

    const body = await request.json()
    const result = InquirySchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest(ERROR_MESSAGES.INVALID_INPUT, result.error.flatten().fieldErrors)
    }

    const { name, email, message, topic } = result.data

    // sendCustomEmail() resolves `{ success: false, error }` on SMTP /
    // Listmonk failure rather than throwing — bare `.catch()` only catches
    // actual rejections so resolved-failures slip through silently. The
    // inquiry form is the primary public contact channel for volunteers,
    // donors and tech-help seekers; a silent send failure means inbound
    // interest is invisible to staff. Inspect the resolved value in
    // `.then()` and log both modes separately so ops can grep for the
    // `(resolved)` vs `(rejected)` suffix. Same shape as the dropoff
    // route's a4f2d601 fix and the 11+ prior swallow fixes in this codebase.
    sendCustomEmail(CONTACT.email, inquiryNotification(name, email, topic, message))
      .then(r => {
        if (!r.success) {
          logger.warn('Failed to send inquiry notification (resolved)', { error: r.error, topic })
        }
      })
      .catch(err => logger.warn('Failed to send inquiry notification (rejected)', { error: err, topic }))

    sendCustomEmail(email, inquiryConfirmation(name, topic))
      .then(r => {
        if (!r.success) {
          logger.warn('Failed to send inquiry confirmation (resolved)', { error: r.error, email })
        }
      })
      .catch(err => logger.warn('Failed to send inquiry confirmation (rejected)', { error: err, email }))

    logger.info('Inquiry submitted', { topic, email })

    return apiSuccess({ message: 'Anfrage gesendet' })
  } catch (error) {
    return apiError(error, 'Fehler beim Senden der Anfrage')
  }
}
