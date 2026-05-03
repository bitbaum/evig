import { NextRequest } from 'next/server'
import { db } from '@/db'
import { itHilfeRequests, repairerProfiles, users } from '@/db/schema'
import { eq, and, sql, desc, inArray } from 'drizzle-orm'
import { apiError, apiSuccessCached, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { REQUEST_STATUS } from '@/config/it-hilfe'

/**
 * GET /api/repairers/[id]/matching-requests
 * Find open IT-Hilfe requests that match a repairer's skills/services.
 * Public endpoint — shows open requests that the repairer could help with.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get repairer profile with their services
    const [repairer] = await db
      .select({
        id: repairerProfiles.id,
        servicesOffered: repairerProfiles.servicesOffered,
        city: repairerProfiles.city,
        postalCode: repairerProfiles.postalCode,
        serviceRadiusKm: repairerProfiles.serviceRadiusKm,
        remoteServices: repairerProfiles.remoteServices,
      })
      .from(repairerProfiles)
      .where(and(
        eq(repairerProfiles.id, id),
        eq(repairerProfiles.isActive, true)
      ))

    if (!repairer) {
      return apiNotFound(ERROR_MESSAGES.REPAIRER_NOT_FOUND)
    }

    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get('limit') || '5'),
      20
    )

    // Find open IT-Hilfe requests matching the repairer's services.
    // Match on: skills_needed overlap with services_offered, or same city/canton.
    const matchingRequests = await db
      .select({
        id: itHilfeRequests.id,
        title: itHilfeRequests.title,
        categoryId: itHilfeRequests.categoryId,
        deviceBrand: itHilfeRequests.deviceBrand,
        deviceModel: itHilfeRequests.deviceModel,
        urgency: itHilfeRequests.urgency,
        budgetType: itHilfeRequests.budgetType,
        city: itHilfeRequests.city,
        canton: itHilfeRequests.canton,
        postalCode: itHilfeRequests.postalCode,
        serviceType: itHilfeRequests.serviceType,
        skillsNeeded: itHilfeRequests.skillsNeeded,
        status: itHilfeRequests.status,
        offerCount: itHilfeRequests.offerCount,
        createdAt: itHilfeRequests.createdAt,
        requesterName: users.name,
      })
      .from(itHilfeRequests)
      .innerJoin(users, eq(itHilfeRequests.requesterId, users.id))
      .where(and(
        inArray(itHilfeRequests.status, [REQUEST_STATUS.OPEN, REQUEST_STATUS.IN_DISCUSSION]),
        sql`(${itHilfeRequests.expiresAt} IS NULL OR ${itHilfeRequests.expiresAt} > NOW())`,
        // Match: request skills overlap with repairer services, OR same city
        sql`(
          ${itHilfeRequests.skillsNeeded} && ${sql`ARRAY[${sql.join(
            (repairer.servicesOffered || []).map(s => sql`${s}`),
            sql`, `
          )}]::text[]`}
          OR ${itHilfeRequests.city} = ${repairer.city}
        )`,
      ))
      .orderBy(desc(itHilfeRequests.createdAt))
      .limit(limit)

    logger.info('Fetched matching IT-Hilfe requests for repairer', {
      repairerId: id,
      matchCount: matchingRequests.length,
    })

    // Matching requests change as new requests are posted — cache 30s, stale 15s
    return apiSuccessCached({
      requests: matchingRequests,
      repairerServices: repairer.servicesOffered,
    }, 30, 15)
  } catch (error) {
    logger.error('Error fetching matching requests for repairer', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
