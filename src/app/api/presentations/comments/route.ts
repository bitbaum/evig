import { NextRequest } from 'next/server'
import { inArray } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { presentationComments, users } from '@/db/schema'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { PRESENTATION_DECKS } from '@/config/presentations'
import { SUPER_ADMIN_EMAILS, isStaffEmail } from '@/lib/permissions'
import { createNotification } from '@/lib/services/notifications'

const BODY_MIN = 2
const BODY_MAX = 2000
const NAME_MAX = 80

/**
 * GET = "who am I" for the comment form, so a signed-in reader doesn't retype
 * their name and we can show "Kommentar als <Name>".
 */
export async function GET() {
  const session = await auth()
  return apiSuccess({ signedIn: !!session?.user, name: session?.user?.name ?? null })
}

/**
 * POST a slide comment. Public — works signed in OR anonymously. Signed-in
 * identity is taken from the session (not spoofable); anonymous commenters may
 * pass an optional display name. Notifies super admins in-app.
 */
export async function POST(req: NextRequest) {
  try {
    const json = (await req.json().catch(() => ({}))) as Record<string, unknown>

    // Honeypot: bots fill hidden fields. Pretend success, store nothing.
    if (typeof json.hp === 'string' && json.hp.trim() !== '') return apiSuccess({ ok: true })

    const slug = String(json.slug ?? '')
    const deck = PRESENTATION_DECKS.find(d => d.slug === slug)
    if (!deck) return apiBadRequest('Unbekannte Präsentation.')

    const slideIndex = Number(json.slideIndex)
    if (!Number.isInteger(slideIndex) || slideIndex < 0 || slideIndex > 500) {
      return apiBadRequest('Ungültige Folie.')
    }

    const body = String(json.body ?? '').trim()
    if (body.length < BODY_MIN || body.length > BODY_MAX) {
      return apiBadRequest(`Kommentar muss zwischen ${BODY_MIN} und ${BODY_MAX} Zeichen lang sein.`)
    }

    const slideTitle = json.slideTitle ? String(json.slideTitle).slice(0, 200) : null

    const session = await auth()
    const uid = session?.user?.id ?? null
    const signedIn = !!uid
    const authorName = signedIn
      ? (session?.user?.name ?? null)
      : (json.name ? (String(json.name).trim().slice(0, NAME_MAX) || null) : null)
    const isStaff = signedIn ? isStaffEmail(session?.user?.email ?? '') : false

    await db.insert(presentationComments).values({
      deckSlug: slug,
      slideIndex,
      slideTitle,
      body,
      authorName,
      authorUserId: uid,
      isStaff,
    })

    // Notify super admins in-app (email skipped — bell survives deliverability).
    try {
      const admins = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.email, [...SUPER_ADMIN_EMAILS]))
      const who = authorName || (signedIn ? 'Angemeldete:r' : 'Anonym')
      await Promise.all(
        admins.map(a =>
          createNotification(
            a.id,
            {
              type: 'presentation_comment',
              title: 'Neuer Kommentar zur Präsentation',
              content: `${deck.title} · Folie ${slideIndex + 1} — ${who}: ${body.slice(0, 120)}`,
              related_type: 'presentation',
              related_id: slug,
            },
            { skipEmail: true },
          ),
        ),
      )
    } catch (e) {
      logger.error('presentation comment notify failed', { error: e })
    }

    return apiSuccess({ ok: true })
  } catch (error) {
    logger.error('presentation comment POST failed', { error })
    return apiError(null, 'Kommentar konnte nicht gespeichert werden', 500)
  }
}
