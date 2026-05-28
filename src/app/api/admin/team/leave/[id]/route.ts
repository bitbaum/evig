/**
 * DELETE /api/admin/team/leave/[id]
 *
 * Removes a single leave period. Used by HR to revoke a leave entry
 * (e.g. someone's vacation was cancelled, sick days reclassified).
 * Hard delete — leave records are operational metadata, not audit-
 * critical financial data. Compensation_history is the table that
 * stays immutable.
 */

import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiNotFound, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { leavePeriods } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const DELETE = withAdmin<{ id: string }>('team', async (
  _request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const leaveId = context?.params?.id
    if (!leaveId) return apiBadRequest('Urlaub-ID fehlt')

    const deleted = await db
      .delete(leavePeriods)
      .where(eq(leavePeriods.id, leaveId))
      .returning({ id: leavePeriods.id })

    if (deleted.length === 0) return apiNotFound('Urlaubseintrag')

    logger.info('Leave period deleted', { leaveId, adminId: session.user.id })
    return apiSuccess({ id: leaveId })
  } catch (error) {
    logger.error('Failed to delete leave period', { error })
    return apiError(error, 'Urlaubseintrag konnte nicht gelöscht werden')
  }
})
