import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { workshopRegistrations } from '@/db/schema'
import { eq, and, ne, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { WORKSHOP_REGISTRATION_STATUS, WORKSHOP_PAYMENT_STATUS } from '@/config/workshop-registration-status'

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

    // Default action: cancel registration if not already cancelled.
    // Returns workshopInstanceId + paymentStatus so we can decrement the
    // instance's participant count for paid registrations — register-with-
    // payment increments current_participants at INSERT (route.ts:140), so
    // without a matching decrement on cancel the count leaks (same shape as
    // the webhook fix in eac01d4a). Basic-register (paymentStatus =
    // 'not_required') never incremented, so it doesn't need to decrement.
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
      .returning({
        id: workshopRegistrations.id,
        workshopInstanceId: workshopRegistrations.workshopInstanceId,
        paymentStatus: workshopRegistrations.paymentStatus,
      })

    if (result.length === 0) {
      return apiBadRequest('Anmeldung nicht gefunden oder bereits storniert')
    }

    const cancelled = result[0]
    if (
      cancelled.workshopInstanceId &&
      cancelled.paymentStatus !== WORKSHOP_PAYMENT_STATUS.NOT_REQUIRED
    ) {
      // current_participants is a real DB column (cms-api migration 003)
      // but isn't modeled in the Drizzle schema — raw SQL matches the
      // increment shape in register-with-payment/route.ts:141. GREATEST
      // clamps so a double-cancel race can't drive the count negative.
      await db.execute(sql`
        UPDATE workshop_instances
        SET current_participants = GREATEST(current_participants - 1, 0)
        WHERE id = ${cancelled.workshopInstanceId}
      `)
    }

    return apiSuccess({})
  } catch (e) {
    return apiError(e, 'Stornierung fehlgeschlagen')
  }
})
