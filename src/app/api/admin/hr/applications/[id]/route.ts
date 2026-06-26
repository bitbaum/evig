/**
 * GET /api/admin/hr/applications/[id]
 */

import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { getApplicationById } from '@/lib/services/hr-applications'
import { logger } from '@/lib/logger'

export const GET = withAdmin<{ id: string }>('team', async (_request, _session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')
    const application = await getApplicationById(id)
    if (!application) return apiNotFound('Bewerbung')
    return apiSuccess(application)
  } catch (error) {
    logger.error('Failed to get HR application', { error })
    return apiError(error, 'Bewerbung konnte nicht geladen werden')
  }
})
