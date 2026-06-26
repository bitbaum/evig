/**
 * Admin HR applications
 * GET /api/admin/hr/applications
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { listApplicationsAdmin } from '@/lib/services/hr-applications'
import { APPLICATION_STATUS_OPTIONS, type ApplicationStatus } from '@/config/hr-application-status'
import { logger } from '@/lib/logger'

export const GET = withAdmin('team', async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const jobPostingId = searchParams.get('job_posting_id')
    const search = searchParams.get('search')

    const applications = await listApplicationsAdmin({
      status:
        status && APPLICATION_STATUS_OPTIONS.includes(status as ApplicationStatus)
          ? (status as ApplicationStatus)
          : undefined,
      job_posting_id: jobPostingId ?? undefined,
      search: search ?? undefined,
    })

    return apiSuccess({ applications })
  } catch (error) {
    logger.error('Failed to list HR applications', { error })
    return apiError(error, 'Bewerbungen konnten nicht geladen werden')
  }
})
