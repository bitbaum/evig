/**
 * Suggestions/Feedback API
 *
 * POST /api/suggestions — Submit feedback or contact form message
 */

import { NextRequest } from 'next/server'
import { apiSuccess, apiError, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
import { CONTACT, ORG } from '@/config/org'
import { rateLimiters, getClientIdentifier } from '@/lib/security/rate-limit'
import { z } from 'zod'
import { escapeHtml } from '@/lib/utils/escape-html'
import { EMAIL_INLINE_COLORS } from '@/config/ui-colors'

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
      return apiRateLimited()
    }

    const body = await request.json()
    const result = SuggestionSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest(ERROR_MESSAGES.INVALID_INPUT)
    }

    const data = result.data

    logger.info('Suggestion received', {
      page: data.page,
      contact: data.contact,
      ip: clientIp,
    })

    // Public form — every interpolated user field gets HTML-escaped
    // before reaching the html: body. text: bodies stay verbatim.
    const truncated = data.suggestion.slice(0, 500) + (data.suggestion.length > 500 ? '...' : '')
    const eContact = escapeHtml(data.contact || 'Anonym')
    const ePage = escapeHtml(data.page || '-')
    const eTimestamp = escapeHtml(data.timestamp || new Date().toISOString())

    // Send confirmation to submitter if they provided an email (fire-and-forget)
    if (data.contact && data.contact.includes('@')) {
      sendCustomEmail(data.contact, {
        subject: `Deine Nachricht wurde empfangen — ${ORG.name}`,
        html: `<p>Hallo,</p><p>vielen Dank für deine Nachricht an ${ORG.name}. Wir haben sie erhalten und melden uns so bald wie möglich bei dir.</p><p>Deine Nachricht:<br><em>${escapeHtml(truncated)}</em></p><p>Mit freundlichen Grüssen,<br>Das ${ORG.name} Team</p>`,
        text: `Hallo,\n\nvielen Dank für deine Nachricht an ${ORG.name}. Wir haben sie erhalten und melden uns so bald wie möglich bei dir.\n\nDeine Nachricht:\n${truncated}\n\nMit freundlichen Grüssen,\nDas ${ORG.name} Team`,
      }).catch(err => logger.warn('Failed to send suggestion confirmation email', { error: err }))
    }

    // Send notification email to team
    sendCustomEmail(CONTACT.email, {
      subject: `Neue Nachricht von ${data.contact || 'Anonym'} — ${data.pageTitle || 'Kontaktformular'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2>Neue Nachricht</h2>
          <p><strong>Von:</strong> ${eContact}</p>
          <p><strong>Seite:</strong> ${ePage}</p>
          <p><strong>Zeitpunkt:</strong> ${eTimestamp}</p>
          <hr />
          <div style="white-space: pre-wrap; padding: 16px; background: ${EMAIL_INLINE_COLORS.mutedBlockBg}; border-radius: 8px;">
${escapeHtml(data.suggestion)}
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
