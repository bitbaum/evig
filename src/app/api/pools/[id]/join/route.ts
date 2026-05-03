/**
 * POST /api/pools/[id]/join — Join a subscription pool
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { db } from '@/db'
import { subscriptionPools, poolMemberships } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { TABLE_NAMES, POOL_STATUS, POOL_MEMBERSHIP_STATUS } from '@/config/database'
import { logger } from '@/lib/logger'

type Params = { id: string }

export const POST = withAuth(async (
  _request: NextRequest,
  session,
  context?: { params?: Params }
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest(ERROR_MESSAGES.POOL_ID_REQUIRED)

    // Load pool
    const [pool] = await db
      .select({
        id: subscriptionPools.id,
        maxMembers: subscriptionPools.maxMembers,
        status: subscriptionPools.status,
        memberCount: sql<number>`(
          SELECT COUNT(*) FROM ${sql.raw(TABLE_NAMES.POOL_MEMBERSHIPS)} pm
          WHERE pm.pool_id = ${subscriptionPools.id}
          AND pm.status = ${POOL_MEMBERSHIP_STATUS.ACTIVE}
        )`,
      })
      .from(subscriptionPools)
      .where(eq(subscriptionPools.id, id))
      .limit(1)

    if (!pool) return apiNotFound('Pool nicht gefunden')
    if (pool.status !== POOL_STATUS.ACTIVE) return apiBadRequest('Dieser Pool ist nicht aktiv')
    if (Number(pool.memberCount) >= pool.maxMembers) {
      return apiBadRequest('Dieser Pool ist bereits voll')
    }

    // Check existing membership
    const [existing] = await db
      .select({ id: poolMemberships.id, status: poolMemberships.status })
      .from(poolMemberships)
      .where(
        and(
          eq(poolMemberships.poolId, id),
          eq(poolMemberships.userId, session.user.id)
        )
      )
      .limit(1)

    if (existing) {
      if (existing.status === POOL_MEMBERSHIP_STATUS.ACTIVE) {
        return apiBadRequest('Du bist bereits Mitglied dieses Pools')
      }
      // Re-activate if previously left
      const [updated] = await db
        .update(poolMemberships)
        .set({ status: POOL_MEMBERSHIP_STATUS.ACTIVE, leftAt: null })
        .where(eq(poolMemberships.id, existing.id))
        .returning()
      return apiSuccess(updated)
    }

    const [membership] = await db
      .insert(poolMemberships)
      .values({
        poolId: id,
        userId: session.user.id,
        role: 'member',
        status: POOL_MEMBERSHIP_STATUS.ACTIVE,
      })
      .returning()

    logger.info('User joined pool', { poolId: id, userId: session.user.id })
    return apiSuccess(membership, 201)
  } catch (error) {
    logger.error('POST /api/pools/[id]/join failed', { error })
    return apiError(error, 'Fehler beim Beitreten des Pools')
  }
})
