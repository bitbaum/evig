import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { listStaffCandidates } from '@/lib/services/teams'
import { logger } from '@/lib/logger'

/** Staff members eligible to be added to a team (member-picker source). */
export const GET = withAdmin('teams', async (_request: NextRequest, session: ValidSession) => {
  try {
    const rows = await listStaffCandidates()
    return apiSuccess(rows)
  } catch (error) {
    logger.error('Error listing staff candidates', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Laden der Mitarbeitenden')
  }
})
