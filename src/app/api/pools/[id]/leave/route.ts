/**
 * POST /api/pools/[id]/leave — Leave a subscription pool
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { db } from '@/db'
import { subscriptionPools, poolMemberships } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { logger } from '@/lib/logger'

type Params = { id: string }

export const POST = withAuth(async (
  _request: NextRequest,
  session,
  context?: { params?: Params }
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('Pool-ID fehlt')

    const [membership] = await db
      .select({ id: poolMemberships.id, role: poolMemberships.role })
      .from(poolMemberships)
      .where(
        and(
          eq(poolMemberships.poolId, id),
          eq(poolMemberships.userId, session.user.id),
          eq(poolMemberships.status, 'active')
        )
      )
      .limit(1)

    if (!membership) return apiNotFound('Du bist kein Mitglied dieses Pools')
    if (membership.role === 'owner') {
      return apiBadRequest('Als Pool-Inhaber kannst du den Pool nicht verlassen. Lösche ihn stattdessen.')
    }

    await db
      .update(poolMemberships)
      .set({ status: 'left', leftAt: new Date().toISOString() })
      .where(eq(poolMemberships.id, membership.id))

    logger.info('User left pool', { poolId: id, userId: session.user.id })
    return apiSuccess({ message: 'Pool verlassen' })
  } catch (error) {
    logger.error('POST /api/pools/[id]/leave failed', { error })
    return apiError(error, 'Fehler beim Verlassen des Pools')
  }
})
