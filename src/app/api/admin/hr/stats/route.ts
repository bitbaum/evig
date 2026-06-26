/**
 * GET /api/admin/hr/stats — funnel analytics
 */

import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { getHrFunnelStats } from '@/lib/services/hr-analytics'
import { logger } from '@/lib/logger'

export const GET = withAdmin('team', async () => {
  try {
    const stats = await getHrFunnelStats()
    return apiSuccess(stats)
  } catch (error) {
    logger.error('Failed to load HR stats', { error })
    return apiError(error, 'Statistiken konnten nicht geladen werden')
  }
})
