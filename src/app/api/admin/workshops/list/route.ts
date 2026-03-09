import { NextRequest } from 'next/server'
import { db } from '@/db'
import { workshops, workshopInstances } from '@/db/schema'
import { eq, asc, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

// GET /api/admin/workshops/list - List all workshops for admin selection
export const GET = withAdmin('workshops-admin', async (request, session) => {
  try {
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const rows = await db
      .select({
        id: workshops.id,
        title: workshops.title,
        slug: workshops.slug,
        category: workshops.category,
        level: workshops.level,
        maxParticipants: workshops.maxParticipants,
        priceCents: workshops.priceCents,
        isActive: workshops.isActive,
        instanceCount: sql<number>`count(${workshopInstances.id})`,
      })
      .from(workshops)
      .leftJoin(workshopInstances, eq(workshops.id, workshopInstances.workshopId))
      .where(activeOnly ? eq(workshops.isActive, true) : undefined)
      .groupBy(workshops.id)
      .orderBy(asc(workshops.title))

    return apiSuccess({
      workshops: rows.map(w => ({
        ...w,
        instance_count: Number(w.instanceCount) || 0,
      }))
    })

  } catch (error) {
    logger.error('Error fetching workshops list', { error })
    return apiError(error, 'Failed to fetch workshops')
  }
})
