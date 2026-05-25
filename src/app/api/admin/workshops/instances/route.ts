import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { workshopInstances, workshops, workshopRegistrations } from '@/db/schema'
import { eq, and, gt, sql, desc } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, parsePagination } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'
import { WORKSHOP_INSTANCE_STATUS } from '@/config/workshops'
import { ORG, LOCATIONS } from '@/config/org'

// GET /api/admin/workshops/instances - List all workshop instances
export const GET = withAdmin('workshops-admin', async (request, session) => {
  try {
    const searchParams = request.nextUrl.searchParams
    const workshopId = searchParams.get('workshopId')
    const status = searchParams.get('status') || 'all'
    const upcoming = searchParams.get('upcoming') === 'true'
    const { limit, offset } = parsePagination(request)

    // Build conditions
    const conditions = []
    if (workshopId) conditions.push(eq(workshopInstances.workshopId, workshopId))
    if (status !== 'all') conditions.push(eq(workshopInstances.status, status))
    if (upcoming) conditions.push(gt(workshopInstances.startDate, sql`NOW()`))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    // Fetch instances with aggregated participant counts
    const instanceRows = await db
      .select({
        id: workshopInstances.id,
        workshopId: workshopInstances.workshopId,
        startDate: workshopInstances.startDate,
        endDate: workshopInstances.endDate,
        location: workshopInstances.location,
        instructor: workshopInstances.instructor,
        maxParticipants: workshopInstances.maxParticipants,
        notes: workshopInstances.notes,
        status: workshopInstances.status,
        createdAt: workshopInstances.createdAt,
        updatedAt: workshopInstances.updatedAt,
        workshop_title: workshops.title,
        workshop_slug: workshops.slug,
        // Exclude CANCELLED — they don't occupy a seat (matches the
        // workshop_instances.current_participants invariant fixed in
        // eac01d4a/d38a2787 on the increment-vs-decrement side).
        current_participants: sql<string>`COUNT(CASE WHEN ${workshopRegistrations.status} != ${WORKSHOP_REGISTRATION_STATUS.CANCELLED} THEN ${workshopRegistrations.id} END)`,
        confirmed_count: sql<string>`COUNT(CASE WHEN ${workshopRegistrations.status} = ${WORKSHOP_REGISTRATION_STATUS.CONFIRMED} THEN 1 END)`,
        pending_count: sql<string>`COUNT(CASE WHEN ${workshopRegistrations.status} = ${WORKSHOP_REGISTRATION_STATUS.PENDING} THEN 1 END)`,
      })
      .from(workshopInstances)
      .innerJoin(workshops, eq(workshopInstances.workshopId, workshops.id))
      .leftJoin(workshopRegistrations, eq(workshopInstances.id, workshopRegistrations.workshopInstanceId))
      .where(where)
      .groupBy(workshopInstances.id, workshops.title, workshops.slug)
      .orderBy(desc(workshopInstances.startDate))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [countRow] = await db
      .select({ total: sql<number>`count(DISTINCT ${workshopInstances.id})::int` })
      .from(workshopInstances)
      .innerJoin(workshops, eq(workshopInstances.workshopId, workshops.id))
      .where(where)

    const total = countRow?.total ?? 0

    return apiSuccess({
      instances: instanceRows.map(inst => ({
        ...inst,
        current_participants: parseInt(inst.current_participants) || 0,
        confirmed_count: parseInt(inst.confirmed_count) || 0,
        pending_count: parseInt(inst.pending_count) || 0
      })),
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    logger.error('Error fetching workshop instances', { error })
    return apiError(error, 'Failed to fetch workshop instances')
  }
})

// POST /api/admin/workshops/instances - Create new workshop instance
export const POST = withAdmin('workshops-admin', async (request, session) => {
  try {
    const body = await request.json()
    const {
      workshopId,
      startDate,
      endDate,
      location,
      instructor,
      maxParticipants,
      notes,
      status = WORKSHOP_INSTANCE_STATUS.SCHEDULED
    } = body

    if (!workshopId || !startDate) {
      return apiBadRequest('workshopId and startDate are required')
    }

    // Verify workshop exists
    const [workshop] = await db
      .select({ id: workshops.id, maxParticipants: workshops.maxParticipants })
      .from(workshops)
      .where(eq(workshops.id, workshopId))

    if (!workshop) {
      return apiBadRequest('Workshop not found')
    }

    const [instance] = await db
      .insert(workshopInstances)
      .values({
        workshopId,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        location: location || `${ORG.name}, ${LOCATIONS.store.full}`,
        instructor: instructor || undefined,
        maxParticipants: maxParticipants || workshop.maxParticipants,
        notes: notes || undefined,
        status,
      })
      .returning()

    logger.info('Workshop instance created', {
      instanceId: instance.id,
      workshopId,
      createdBy: session.user.id
    })

    return apiSuccess({
      instance,
      message: 'Workshop instance created successfully'
    })

  } catch (error) {
    logger.error('Error creating workshop instance', { error })
    return apiError(error, 'Failed to create workshop instance')
  }
})
