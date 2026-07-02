import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiNotFound, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { timecardReviewActionSchema, timecardSaveSchema } from '@/lib/schemas/timecards'
import { reviewTimecard, getTimecardByIdForReview, saveTimecardEntriesForReview } from '@/lib/services/timecards'
import { db } from '@/db'
import { timecards } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Approver views a single submitted card (with its day entries) before deciding.
export const GET = withAdmin('timecards', async (
  _request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('Zeitkarten-ID ist erforderlich')
    const card = await getTimecardByIdForReview(id)
    if (!card) return apiNotFound('Zeitkarte')
    return apiSuccess(card)
  } catch (error) {
    logger.error('Error loading timecard for review', { error, reviewerId: session.user.id })
    return apiError(error, 'Zeitkarte konnte nicht geladen werden')
  }
})

// Approver edits a submitted card's entries (saved to the card's owner, status preserved).
export const PUT = withAdmin('timecards', async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('Zeitkarten-ID ist erforderlich')

    const body = await request.json()
    const parsed = timecardSaveSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest('Ungültige Eingabedaten', parsed.error.flatten().fieldErrors)
    }

    const result = await saveTimecardEntriesForReview(id, parsed.data)
    return apiSuccess(result)
  } catch (error) {
    logger.error('Error editing timecard as approver', { error, reviewerId: session.user.id })
    return apiError(error, 'Zeitkarte konnte nicht gespeichert werden')
  }
})

export const PATCH = withAdmin('timecards', async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('Zeitkarten-ID ist erforderlich')

    const body = await request.json()
    const parsed = timecardReviewActionSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest('Ungültige Eingabedaten', parsed.error.flatten().fieldErrors)
    }

    const [existing] = await db
      .select({ id: timecards.id })
      .from(timecards)
      .where(eq(timecards.id, id))
      .limit(1)

    if (!existing) return apiNotFound('Zeitkarte')

    const result = await reviewTimecard(session.user.id, id, parsed.data)
    return apiSuccess(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'timecard_self_review') {
      return apiBadRequest('Eigene Zeitkarten können nicht selbst freigegeben werden.')
    }
    logger.error('Error reviewing timecard', { error, reviewerId: session.user.id })
    return apiError(error, 'Zeitkarte konnte nicht bearbeitet werden')
  }
})
