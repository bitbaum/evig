import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiNotFound, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { timecardReviewActionSchema } from '@/lib/schemas/timecards'
import { reviewTimecard } from '@/lib/services/timecards'
import { db } from '@/db'
import { timecards } from '@/db/schema'
import { eq } from 'drizzle-orm'

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
    logger.error('Error reviewing timecard', { error, reviewerId: session.user.id })
    return apiError(error, 'Zeitkarte konnte nicht bearbeitet werden')
  }
})
