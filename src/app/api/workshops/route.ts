import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { workshops, workshopInstances, workshopRegistrations } from '@/db/schema'
import { eq, desc, asc, inArray, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiRateLimited } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { rateLimiters, getClientIdentifier } from '@/lib/security/rate-limit'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'

export async function GET(request: NextRequest) {
  const clientIp = getClientIdentifier(request)
  if (!rateLimiters.listingBrowse(clientIp)) return apiRateLimited()

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('active') !== 'false'
    const includeInstances = searchParams.get('include') === 'instances'

    // Build conditions
    const conditions = []
    if (activeOnly) conditions.push(eq(workshops.isActive, true))
    if (category) conditions.push(eq(workshops.category, category))

    const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined

    const workshopRows = await db
      .select({
        id: workshops.id,
        slug: workshops.slug,
        title: workshops.title,
        description: workshops.description,
        category: workshops.category,
        duration: workshops.duration,
        level: workshops.level,
        max_participants: workshops.maxParticipants,
        price_cents: workshops.priceCents,
        is_active: workshops.isActive,
        created_at: workshops.createdAt,
      })
      .from(workshops)
      .where(where)
      .orderBy(desc(workshops.createdAt))

    if (!includeInstances) {
      return apiSuccess(workshopRows)
    }

    const workshopIds = workshopRows.map(w => w.id)

    if (workshopIds.length === 0) {
      return apiSuccess([])
    }

    // Fetch all instances for all workshops in one query
    const instanceRows = await db
      .select({
        id: workshopInstances.id,
        workshop_id: workshopInstances.workshopId,
        start_date: workshopInstances.startDate,
        end_date: workshopInstances.endDate,
        location: workshopInstances.location,
        max_participants: workshopInstances.maxParticipants,
        status: workshopInstances.status,
        created_at: workshopInstances.createdAt,
        updated_at: workshopInstances.updatedAt,
        // Exclude CANCELLED — see eac01d4a/d38a2787 for the matching
        // invariant on the stored-count side.
        current_participants: sql<number>`count(CASE WHEN ${workshopRegistrations.status} != ${WORKSHOP_REGISTRATION_STATUS.CANCELLED} THEN ${workshopRegistrations.id} END)`,
      })
      .from(workshopInstances)
      .leftJoin(workshopRegistrations, eq(workshopInstances.id, workshopRegistrations.workshopInstanceId))
      .where(inArray(workshopInstances.workshopId, workshopIds))
      .groupBy(workshopInstances.id)
      .orderBy(asc(workshopInstances.startDate))

    // Check user registrations in one query (if logged in)
    const session = await auth()
    const registeredWorkshopIds = new Set<string>()

    if (session?.user?.id) {
      const registrations = await db
        .select({
          workshopId: workshopInstances.workshopId,
        })
        .from(workshopRegistrations)
        .innerJoin(workshopInstances, eq(workshopRegistrations.workshopInstanceId, workshopInstances.id))
        .where(sql`${workshopRegistrations.userId} = ${session.user.id} AND ${workshopInstances.workshopId} IN ${workshopIds}`)

      for (const reg of registrations) {
        registeredWorkshopIds.add(reg.workshopId)
      }
    }

    // Group instances by workshop_id
    const instancesByWorkshop = new Map<string, typeof instanceRows>()
    for (const inst of instanceRows) {
      const list = instancesByWorkshop.get(inst.workshop_id) || []
      list.push(inst)
      instancesByWorkshop.set(inst.workshop_id, list)
    }

    // Assemble response
    const result = workshopRows.map(workshop => ({
      ...workshop,
      instances: (instancesByWorkshop.get(workshop.id) || []).map(inst => ({
        ...inst,
        current_participants: Number(inst.current_participants) || 0,
      })),
      user_registered: registeredWorkshopIds.has(workshop.id),
    }))

    return apiSuccess(result)

  } catch (error) {
    // Handle database connection errors gracefully
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
      return apiSuccess([])
    }
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
