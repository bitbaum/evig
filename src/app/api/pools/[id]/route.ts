/**
 * GET    /api/pools/[id] — Pool detail with members
 * DELETE /api/pools/[id] — Delete pool (owner only)
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { apiSuccessCached, apiSuccess, apiError, apiNotFound, apiForbidden, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { db } from '@/db'
import { subscriptionPools, poolMemberships, users } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { TABLE_NAMES, POOL_STATUS, POOL_MEMBERSHIP_STATUS } from '@/config/database'
import { logger } from '@/lib/logger'

type Params = { id: string }

// ============================================================================
// GET — Pool detail
// ============================================================================

export async function GET(
  _request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params

    const [pool] = await db
      .select({
        id: subscriptionPools.id,
        serviceName: subscriptionPools.serviceName,
        serviceCategory: subscriptionPools.serviceCategory,
        maxMembers: subscriptionPools.maxMembers,
        monthlyCostChf: subscriptionPools.monthlyCostChf,
        costPerMemberChf: subscriptionPools.costPerMemberChf,
        status: subscriptionPools.status,
        description: subscriptionPools.description,
        rules: subscriptionPools.rules,
        createdAt: subscriptionPools.createdAt,
        ownerId: subscriptionPools.ownerId,
        ownerName: users.name,
        memberCount: sql<number>`(
          SELECT COUNT(*) FROM ${sql.raw(TABLE_NAMES.POOL_MEMBERSHIPS)} pm
          WHERE pm.pool_id = ${subscriptionPools.id}
          AND pm.status = ${POOL_MEMBERSHIP_STATUS.ACTIVE}
        )`,
      })
      .from(subscriptionPools)
      .leftJoin(users, eq(subscriptionPools.ownerId, users.id))
      .where(eq(subscriptionPools.id, id))
      .limit(1)

    if (!pool) return apiNotFound(ERROR_MESSAGES.POOL_NOT_FOUND)
    // Pool detail is public; memberCount changes on join/leave — cache 30s, stale 15s
    return apiSuccessCached(pool, 30, 15)
  } catch (error) {
    logger.error('GET /api/pools/[id] failed', { error })
    return apiError(error, 'Fehler beim Laden des Pools')
  }
}

// ============================================================================
// DELETE — Remove pool (owner only)
// ============================================================================

export const DELETE = withAuth(async (
  _request: NextRequest,
  session,
  context?: { params?: Params }
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest(ERROR_MESSAGES.POOL_ID_REQUIRED)

    const [pool] = await db
      .select({ ownerId: subscriptionPools.ownerId })
      .from(subscriptionPools)
      .where(eq(subscriptionPools.id, id))
      .limit(1)

    if (!pool) return apiNotFound(ERROR_MESSAGES.POOL_NOT_FOUND)
    if (pool.ownerId !== session.user.id && !session.user.isSuperAdmin) {
      return apiForbidden('Nur der Pool-Inhaber kann den Pool löschen')
    }

    await db
      .update(subscriptionPools)
      .set({ status: POOL_STATUS.CLOSED })
      .where(eq(subscriptionPools.id, id))

    logger.info('Pool closed', { poolId: id, userId: session.user.id })
    return apiSuccess({ message: 'Pool geschlossen' })
  } catch (error) {
    logger.error('DELETE /api/pools/[id] failed', { error })
    return apiError(error, 'Fehler beim Löschen des Pools')
  }
})

