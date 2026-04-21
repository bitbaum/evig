/**
 * GET /api/pools/my — Return pool IDs the current user is a member of
 */

import { withAuth } from '@/lib/api/middleware'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { db } from '@/db'
import { poolMemberships } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { logger } from '@/lib/logger'

export const GET = withAuth(async (_request, session) => {
  try {
    const memberships = await db
      .select({ poolId: poolMemberships.poolId })
      .from(poolMemberships)
      .where(
        and(
          eq(poolMemberships.userId, session.user.id),
          eq(poolMemberships.status, 'active')
        )
      )

    return apiSuccess(memberships)
  } catch (error) {
    logger.error('GET /api/pools/my failed', { error })
    return apiError(error, 'Fehler beim Laden der Mitgliedschaften')
  }
})
