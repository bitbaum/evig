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
import { POOL_STATUS, POOL_MEMBERSHIP_STATUS } from '@/config/database'
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

    type JoinResult =
      | { kind: 'created'; membership: typeof poolMemberships.$inferSelect }
      | { kind: 'reactivated'; membership: typeof poolMemberships.$inferSelect }
      | { kind: 'error'; status: number; message: string }

    // Lock pool row + count active members + check existing membership atomically.
    // Without this, two concurrent joins on a near-full pool can both pass the
    // capacity check and over-book the pool.
    const result: JoinResult = await db.transaction(async (tx) => {
      const lockedRows = await tx.execute(
        sql`SELECT id, max_members, status
            FROM ${subscriptionPools}
            WHERE id = ${id}
            FOR UPDATE`
      )
      const pool = lockedRows.rows[0] as
        | { id: string; max_members: number; status: string }
        | undefined

      if (!pool) {
        return { kind: 'error', status: 404, message: ERROR_MESSAGES.POOL_NOT_FOUND }
      }
      if (pool.status !== POOL_STATUS.ACTIVE) {
        return { kind: 'error', status: 400, message: 'Dieser Pool ist nicht aktiv' }
      }

      const [countRow] = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(poolMemberships)
        .where(
          and(
            eq(poolMemberships.poolId, id),
            eq(poolMemberships.status, POOL_MEMBERSHIP_STATUS.ACTIVE)
          )
        )

      const memberCount = Number(countRow?.count ?? 0)
      if (memberCount >= pool.max_members) {
        return { kind: 'error', status: 400, message: 'Dieser Pool ist bereits voll' }
      }

      const [existing] = await tx
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
          return { kind: 'error', status: 400, message: 'Du bist bereits Mitglied dieses Pools' }
        }
        const [updated] = await tx
          .update(poolMemberships)
          .set({ status: POOL_MEMBERSHIP_STATUS.ACTIVE, leftAt: null })
          .where(eq(poolMemberships.id, existing.id))
          .returning()
        return { kind: 'reactivated', membership: updated }
      }

      const [membership] = await tx
        .insert(poolMemberships)
        .values({
          poolId: id,
          userId: session.user.id,
          role: 'member',
          status: POOL_MEMBERSHIP_STATUS.ACTIVE,
        })
        .returning()

      return { kind: 'created', membership }
    })

    if (result.kind === 'error') {
      return result.status === 404
        ? apiNotFound(result.message)
        : apiBadRequest(result.message)
    }

    logger.info('User joined pool', { poolId: id, userId: session.user.id, kind: result.kind })
    return apiSuccess(result.membership, result.kind === 'created' ? 201 : 200)
  } catch (error) {
    logger.error('POST /api/pools/[id]/join failed', { error })
    return apiError(error, 'Fehler beim Beitreten des Pools')
  }
})
