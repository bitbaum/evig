/**
 * GET  /api/pools — Browse active subscription pools
 * POST /api/pools — Create a new subscription pool (authenticated)
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { db } from '@/db'
import { subscriptionPools, poolMemberships, users } from '@/db/schema'
import { eq, sql, desc } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { z } from 'zod'

// ============================================================================
// GET — Public browse
// ============================================================================

export async function GET() {
  try {
    const pools = await db
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
        ownerName: users.name,
        memberCount: sql<number>`(
          SELECT COUNT(*) FROM ${TABLE_NAMES.POOL_MEMBERSHIPS} pm
          WHERE pm.pool_id = ${subscriptionPools.id}
          AND pm.status = 'active'
        )`,
        spotsLeft: sql<number>`(
          ${subscriptionPools.maxMembers} - (
            SELECT COUNT(*) FROM ${TABLE_NAMES.POOL_MEMBERSHIPS} pm
            WHERE pm.pool_id = ${subscriptionPools.id}
            AND pm.status = 'active'
          )
        )`,
      })
      .from(subscriptionPools)
      .leftJoin(users, eq(subscriptionPools.ownerId, users.id))
      .where(eq(subscriptionPools.status, 'active'))
      .orderBy(desc(subscriptionPools.createdAt))

    return apiSuccess(pools)
  } catch (error) {
    logger.error('GET /api/pools failed', { error })
    return apiError(error, 'Fehler beim Laden der Abo-Pools')
  }
}

// ============================================================================
// POST — Create pool
// ============================================================================

const CreatePoolSchema = z.object({
  serviceName: z.string().min(2).max(100),
  serviceCategory: z.enum(['streaming', 'software', 'cloud', 'gaming', 'music', 'news', 'other']),
  maxMembers: z.number().int().min(2).max(20),
  monthlyCostChf: z.number().positive().max(1000),
  description: z.string().max(1000).optional(),
  rules: z.string().max(2000).optional(),
})

export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    const body = await request.json()
    const parsed = CreatePoolSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0]?.message ?? 'Ungültige Eingabe')
    }

    const { serviceName, serviceCategory, maxMembers, monthlyCostChf, description, rules } = parsed.data

    const [pool] = await db
      .insert(subscriptionPools)
      .values({
        serviceName,
        serviceCategory,
        maxMembers,
        monthlyCostChf: String(monthlyCostChf),
        ownerId: session.user.id,
        description: description ?? null,
        rules: rules ?? null,
        status: 'active',
      })
      .returning()

    // Owner automatically becomes a member
    await db.insert(poolMemberships).values({
      poolId: pool.id,
      userId: session.user.id,
      role: 'owner',
      status: 'active',
    })

    logger.info('Pool created', { poolId: pool.id, userId: session.user.id })
    return apiSuccess(pool, 201)
  } catch (error) {
    logger.error('POST /api/pools failed', { error })
    return apiError(error, 'Fehler beim Erstellen des Pools')
  }
})
