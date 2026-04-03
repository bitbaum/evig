import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { workshopRegistrations } from '@/db/schema'
import { eq, and, ne, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'

interface UpdateBody {
  feedback?: string
  rating?: number
}

// Cancel workshop registration (set status = 'cancelled')
export const PATCH = withAuth<{ id: string }>(async (
  req: NextRequest,
  session: ValidSession,
  context,
) => {
  const { id } = context!.params!

  try {
    let body: UpdateBody | null = null
    try {
      body = await req.json()
    } catch {
      body = null
    }

    if (body && (body.feedback !== undefined || body.rating !== undefined)) {
      const updateSet: Record<string, unknown> = { updatedAt: sql`NOW()` }

      if (body.feedback !== undefined) {
        updateSet.feedback = String(body.feedback)
      }
      if (body.rating !== undefined) {
        const r = Number(body.rating)
        if (!Number.isFinite(r) || r < 1 || r > 5) {
          return apiBadRequest('Ungültige Bewertung (1-5)')
        }
        updateSet.rating = Math.round(r)
      }

      const result = await db
        .update(workshopRegistrations)
        .set(updateSet)
        .where(and(
          eq(workshopRegistrations.id, id),
          eq(workshopRegistrations.userId, session.user.id),
        ))
        .returning({ id: workshopRegistrations.id })

      if (result.length === 0) {
        return apiNotFound('Anmeldung')
      }
      return apiSuccess({})
    }

    // Default action: cancel registration if not already cancelled
    const result = await db
      .update(workshopRegistrations)
      .set({
        status: WORKSHOP_REGISTRATION_STATUS.CANCELLED,
        cancelledAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      })
      .where(and(
        eq(workshopRegistrations.id, id),
        eq(workshopRegistrations.userId, session.user.id),
        ne(workshopRegistrations.status, WORKSHOP_REGISTRATION_STATUS.CANCELLED),
      ))
      .returning({ id: workshopRegistrations.id })

    if (result.length === 0) {
      return apiBadRequest('Anmeldung nicht gefunden oder bereits storniert')
    }

    return apiSuccess({})
  } catch (e) {
    return apiError(e, 'Stornierung fehlgeschlagen')
  }
})
