/**
 * GET /api/admin/time-off?status=pending|approved|rejected|cancelled|all
 * → the approval queue. Requires the `timecards` section permission.
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { listTimeOffRequests } from '@/lib/services/time-off'

export const GET = withAdmin('timecards', async (request: NextRequest, _session: ValidSession) => {
  try {
    const status = request.nextUrl.searchParams.get('status') ?? 'pending'
    const data = await listTimeOffRequests(status)
    return apiSuccess(data)
  } catch (error) {
    return apiError(error, 'Anträge konnten nicht geladen werden.')
  }
})
