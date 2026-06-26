/**
 * POST /api/admin/hr/vacancies/[id]/duplicate
 */

import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { duplicateVacancy } from '@/lib/services/hr-vacancies'
import { logger } from '@/lib/logger'

export const POST = withAdmin<{ id: string }>('team', async (_request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error

    const copy = await duplicateVacancy(id, userLookup.dbUserId)
    if (!copy) return apiNotFound('Stelle')

    return apiSuccess(copy, 201)
  } catch (error) {
    logger.error('Failed to duplicate HR vacancy', { error })
    return apiError(error, 'Duplizieren fehlgeschlagen')
  }
})
