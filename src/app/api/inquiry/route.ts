import { NextRequest } from 'next/server'
import { apiError, apiSuccess, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
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
    const rateLimit = checkRateLimit(clientIp, 'inquiry')
    if (!rateLimit.allowed) {
      return apiRateLimited('Zu viele Anfragen. Bitte versuche es später erneut.', {
        retryAfter: rateLimit.retryAfter,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      })
    }

    const body = await request.json()
    const result = InquirySchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Ungültige Eingabe', result.error.flatten().fieldErrors)
    }

    const { name, email, message, topic } = result.data

    // Notify admin
    sendCustomEmail(
      CONTACT.email,
      inquiryNotification(name, email, topic, message)
    ).catch(err => logger.warn('Failed to send inquiry notification', { error: err, topic }))

    // Confirm to submitter
    sendCustomEmail(
      email,
      inquiryConfirmation(name, topic)
    ).catch(err => logger.warn('Failed to send inquiry confirmation', { error: err, email }))

    logger.info('Inquiry submitted', { topic, email })

    return apiSuccess({ message: 'Anfrage gesendet' })
  } catch (error) {
    return apiError(error, 'Fehler beim Senden der Anfrage')
  }
}
