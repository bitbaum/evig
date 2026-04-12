/**
 * Suggestions/Feedback API
 *
 * POST /api/suggestions — Submit feedback or contact form message
 */

import { NextRequest } from 'next/server'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
import { CONTACT } from '@/config/org'
import { rateLimiters, getClientIdentifier } from '@/lib/security/rate-limit'
import { z } from 'zod'

const SuggestionSchema = z.object({
  suggestion: z.string().min(1).max(5000),
  contact: z.string().max(500).optional(),
  page: z.string().max(200).optional(),
  url: z.string().max(500).optional(),
  pageTitle: z.string().max(200).optional(),
  pageSection: z.string().max(200).optional(),
  feedbackScope: z.string().max(50).optional(),
  selectedElements: z.array(z.unknown()).optional(),
  timestamp: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 submissions per hour per IP
    const clientIp = getClientIdentifier(request)
    if (!rateLimiters.apiGeneral(clientIp)) {
      return apiBadRequest('Zu viele Anfragen. Bitte versuche es später erneut.')
    }

    const body = await request.json()
    const result = SuggestionSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Ungültige Eingabe')
    }

    const data = result.data

    logger.info('Suggestion received', {
      page: data.page,
      contact: data.contact,
      ip: clientIp,
    })

    // Send notification email to team
    sendCustomEmail(CONTACT.email, {
      subject: `Neue Nachricht von ${data.contact || 'Anonym'} — ${data.pageTitle || 'Kontaktformular'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2>Neue Nachricht</h2>
          <p><strong>Von:</strong> ${data.contact || 'Anonym'}</p>
          <p><strong>Seite:</strong> ${data.page || '-'}</p>
          <p><strong>Zeitpunkt:</strong> ${data.timestamp || new Date().toISOString()}</p>
          <hr />
          <div style="white-space: pre-wrap; padding: 16px; background: #f9f9f9; border-radius: 8px;">
${data.suggestion}
          </div>
        </div>
      `,
      text: `Neue Nachricht von ${data.contact || 'Anonym'}\n\nSeite: ${data.page || '-'}\n\n${data.suggestion}`,
    }).catch(err => logger.warn('Failed to send suggestion email', { error: err }))

    return apiSuccess({ message: 'Nachricht erfolgreich gesendet' })
  } catch (error) {
    logger.error('Error processing suggestion', { error })
    return apiError(error, 'Fehler beim Senden der Nachricht')
  }
}
