/**
 * Suggestions / site-feedback API
 *
 * POST /api/suggestions — the floating feedback widget on public pages.
 *
 * Reliability: the submission is PERSISTED to site_suggestions first (the
 * channel that never silently drops), then super admins get an in-app
 * notification, and finally the team email is sent AND its result is checked
 * (sendCustomEmail resolves { success:false } instead of throwing, so the old
 * fire-and-forget `.catch` never noticed failed delivery).
 */

import { NextRequest } from 'next/server'
import { inArray } from 'drizzle-orm'
import { z } from 'zod'
import { apiSuccess, apiError, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
import { CONTACT, ORG } from '@/config/org'
import { rateLimiters, getClientIdentifier } from '@/lib/security/rate-limit'
import { escapeHtml } from '@/lib/utils/escape-html'
import { EMAIL_INLINE_COLORS } from '@/config/ui-colors'
import { auth } from '@/auth'
import { db } from '@/db'
import { siteSuggestions, users } from '@/db/schema'
import { createNotification } from '@/lib/services/notifications'
import { SUPER_ADMIN_EMAILS } from '@/lib/permissions'

const SuggestionSchema = z.object({
  suggestion: z.string().min(1).max(5000),
  contact: z.string().max(500).optional(),
  page: z.string().max(200).optional(),
  url: z.string().max(500).optional(),
  pageTitle: z.string().max(200).optional(),
  pageSection: z.string().max(200).optional(),
  feedbackScope: z.string().max(50).optional(),
  scope: z.string().max(50).optional(),
  selectedElements: z.array(z.unknown()).optional(),
  timestamp: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limit: general API bucket per IP.
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
    const scope = data.feedbackScope ?? data.scope ?? null

    const session = await auth()
    const authorUserId = session?.user?.id ?? null

    logger.info('Suggestion received', { page: data.page, contact: data.contact, ip: clientIp })

    // 1) PERSIST — the reliable channel. Never silently lost.
    let stored = false
    try {
      await db.insert(siteSuggestions).values({
        suggestion: data.suggestion,
        contact: data.contact ?? null,
        page: data.page ?? null,
        url: data.url ?? null,
        pageTitle: data.pageTitle ?? null,
        pageSection: data.pageSection ?? null,
        scope,
        selectedElements: data.selectedElements ?? null,
        authorUserId,
      })
      stored = true
    } catch (e) {
      logger.error('Failed to persist site suggestion', { error: e })
    }

    // 2) IN-APP notification to super admins — reliable receipt (like presentations).
    try {
      const admins = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.email, [...SUPER_ADMIN_EMAILS]))
      await Promise.all(
        admins.map(a =>
          createNotification(
            a.id,
            {
              type: 'site_suggestion',
              title: 'Neues Website-Feedback',
              content: `${data.pageTitle || data.page || 'Website'} — ${data.contact || 'Anonym'}: ${data.suggestion.slice(0, 140)}`,
              related_type: 'suggestion',
              related_id: data.page ?? undefined,
            },
            { skipEmail: true },
          ),
        ),
      )
    } catch (e) {
      logger.error('Site suggestion notify failed', { error: e })
    }

    // 3) EMAIL the team — best effort, but CHECK the result.
    const eContact = escapeHtml(data.contact || 'Anonym')
    const ePage = escapeHtml(data.page || '-')
    const eTimestamp = escapeHtml(data.timestamp || new Date().toISOString())
    const truncated = data.suggestion.slice(0, 500) + (data.suggestion.length > 500 ? '...' : '')

    const teamRes = await sendCustomEmail(CONTACT.email, {
      subject: `Neues Feedback von ${data.contact || 'Anonym'} — ${data.pageTitle || 'Website'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2>Neues Website-Feedback</h2>
          <p><strong>Von:</strong> ${eContact}</p>
          <p><strong>Seite:</strong> ${ePage}</p>
          <p><strong>Zeitpunkt:</strong> ${eTimestamp}</p>
          <hr />
          <div style="white-space: pre-wrap; padding: 16px; background: ${EMAIL_INLINE_COLORS.mutedBlockBg}; border-radius: 8px;">
${escapeHtml(data.suggestion)}
          </div>
        </div>
      `,
      text: `Neues Website-Feedback von ${data.contact || 'Anonym'}\n\nSeite: ${data.page || '-'}\n\n${data.suggestion}`,
    })
    if (!teamRes?.success) {
      logger.warn('Suggestion team email not delivered', { page: data.page, stored })
    }

    // Confirmation to the submitter if they left an email (fire-and-forget).
    if (data.contact && data.contact.includes('@')) {
      void sendCustomEmail(data.contact, {
        subject: `Deine Nachricht wurde empfangen — ${ORG.name}`,
        html: `<p>Hallo,</p><p>vielen Dank für deine Nachricht an ${ORG.name}. Wir haben sie erhalten und melden uns so bald wie möglich bei dir.</p><p>Deine Nachricht:<br><em>${escapeHtml(truncated)}</em></p><p>Mit freundlichen Grüssen,<br>Das ${ORG.name} Team</p>`,
        text: `Hallo,\n\nvielen Dank für deine Nachricht an ${ORG.name}. Wir haben sie erhalten und melden uns so bald wie möglich bei dir.\n\nDeine Nachricht:\n${truncated}\n\nMit freundlichen Grüssen,\nDas ${ORG.name} Team`,
      }).then(r => { if (!r?.success) logger.warn('Suggestion confirmation email not delivered', {}) })
        .catch(err => logger.warn('Suggestion confirmation email error', { error: err }))
    }

    // Succeeds as long as it landed in at least one durable place.
    if (!stored && !teamRes?.success) {
      return apiError(null, 'Feedback konnte nicht gespeichert werden. Bitte später erneut versuchen.')
    }
    return apiSuccess({ message: 'Nachricht erfolgreich gesendet' })
  } catch (error) {
    logger.error('Error processing suggestion', { error })
    return apiError(error, 'Fehler beim Senden der Nachricht')
  }
}
