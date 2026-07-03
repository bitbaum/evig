import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { reopenTimecard } from '@/lib/services/timecards'

// Reopen a reviewed/locked timecard back to draft (e.g. approved by mistake).
export const POST = withAdmin('timecards', async (
  _request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('Zeitkarten-ID ist erforderlich')
    const result = await reopenTimecard(id, session.user.id)
    logger.info('Timecard reopened', { timecardId: id, by: session.user.id })
    return apiSuccess(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'timecard_payroll_locked') {
      return apiBadRequest('Diese Zeitkarte ist in einem Lohnlauf gesperrt und kann nicht wieder geöffnet werden.')
    }
    logger.error('Error reopening timecard', { error, reviewerId: session.user.id })
    return apiError(error, 'Zeitkarte konnte nicht wieder geöffnet werden')
  }
})
