import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { parsePagination } from '@/lib/api/helpers'
import { validateQuery } from '@/lib/schemas'
import { timecardFilterSchema } from '@/lib/schemas/timecards'
import { listTimecards } from '@/lib/services/timecards'

export const GET = withAdmin('timecards', async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url)
    const filterResult = validateQuery(timecardFilterSchema, {
      user_id: searchParams.get('user_id'),
      status: searchParams.get('status'),
      period_start: searchParams.get('period_start'),
      period_end: searchParams.get('period_end'),
    })

    if (!filterResult.success) {
      return filterResult.error
    }

    const { limit, offset } = parsePagination(request, { defaultLimit: 25, maxLimit: 100 })
    const rows = await listTimecards({
      userId: filterResult.data.user_id,
      status: filterResult.data.status,
      periodType: searchParams.get('period_type') === 'week' ? 'week' : searchParams.get('period_type') === 'month' ? 'month' : undefined,
      periodStart: filterResult.data.period_start,
      periodEnd: filterResult.data.period_end,
      limit,
      offset,
    })

    return apiSuccess({ items: rows, limit, offset })
  } catch (error) {
    logger.error('Error loading admin timecards', { error, userId: session.user.id })
    return apiError(error, 'Zeitkarten konnten nicht geladen werden')
  }
})
