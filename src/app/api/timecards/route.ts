import { NextRequest } from 'next/server'
import { withAuth, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import {
  timecardPeriodQuerySchema,
  timecardSaveSchema,
} from '@/lib/schemas/timecards'
import {
  getOrCreateTimecardForUser,
  saveTimecardDraft,
  submitTimecard,
} from '@/lib/services/timecards'

export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url)
    const periodResult = timecardPeriodQuerySchema.safeParse({
      period_type: searchParams.get('period_type') || undefined,
      period_date: searchParams.get('period_date') || undefined,
    })

    if (!periodResult.success) {
      return apiBadRequest('Ungültige Abfrageparameter', periodResult.error.flatten().fieldErrors)
    }

    const timecard = await getOrCreateTimecardForUser(session.user.id, periodResult.data)
    return apiSuccess(timecard)
  } catch (error) {
    logger.error('Error loading timecard', { error, userId: session.user.id })
    return apiError(error, 'Zeitkarte konnte nicht geladen werden')
  }
})

export const PUT = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json()
    const parsed = timecardSaveSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest('Ungültige Eingabedaten', parsed.error.flatten().fieldErrors)
    }

    const timecard = await saveTimecardDraft(session.user.id, parsed.data)
    return apiSuccess(timecard)
  } catch (error) {
    logger.error('Error saving timecard draft', { error, userId: session.user.id })
    return apiError(error, 'Zeitkarte konnte nicht gespeichert werden')
  }
})

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json()
    const parsed = timecardSaveSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest('Ungültige Eingabedaten', parsed.error.flatten().fieldErrors)
    }

    const timecard = await submitTimecard(session.user.id, parsed.data)
    return apiSuccess(timecard)
  } catch (error) {
    logger.error('Error submitting timecard', { error, userId: session.user.id })
    return apiError(error, 'Zeitkarte konnte nicht eingereicht werden')
  }
})
