import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { itHilfeOffers, itHilfeRequests, users } from '@/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, parsePagination } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

/**
 * GET /api/it-hilfe/my-offers
 * Get current user's submitted offers
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const { limit, offset } = parsePagination(request, { defaultLimit: 20, maxLimit: 50 })

    const conditions = [eq(itHilfeOffers.helperId, session.user.id)]

    if (status) {
      conditions.push(eq(itHilfeOffers.status, status))
    }

    const where = and(...conditions)

    const rows = await db
      .select({
        id: itHilfeOffers.id,
        requestId: itHilfeOffers.requestId,
        message: itHilfeOffers.message,
        estimatedTime: itHilfeOffers.estimatedTime,
        proposedCompensation: itHilfeOffers.proposedCompensation,
        relevantSkills: itHilfeOffers.relevantSkills,
        status: itHilfeOffers.status,
        createdAt: itHilfeOffers.createdAt,
        // Request details
        request_title: itHilfeRequests.title,
        request_category_id: itHilfeRequests.categoryId,
        request_device_brand: itHilfeRequests.deviceBrand,
        request_device_model: itHilfeRequests.deviceModel,
        request_status: itHilfeRequests.status,
        request_city: itHilfeRequests.city,
        request_canton: itHilfeRequests.canton,
        requester_name: users.name,
      })
      .from(itHilfeOffers)
      .innerJoin(itHilfeRequests, eq(itHilfeOffers.requestId, itHilfeRequests.id))
      .innerJoin(users, eq(itHilfeRequests.requesterId, users.id))
      .where(where)
      .orderBy(desc(itHilfeOffers.createdAt))
      .limit(limit)
      .offset(offset)

    const [countRow] = await db
      .select({ total: sql<number>`count(*)` })
      .from(itHilfeOffers)
      .where(where)

    const total = Number(countRow?.total ?? 0)

    const offers = rows.map(row => ({
      id: row.id,
      requestId: row.requestId,
      message: row.message,
      estimatedTime: row.estimatedTime,
      proposedCompensation: row.proposedCompensation,
      relevantSkills: row.relevantSkills || [],
      status: row.status,
      createdAt: row.createdAt,
      request: {
        id: row.requestId,
        title: row.request_title,
        categoryId: row.request_category_id,
        deviceBrand: row.request_device_brand,
        deviceModel: row.request_device_model,
        status: row.request_status,
        city: row.request_city,
        canton: row.request_canton,
        requesterName: row.requester_name,
      },
    }))

    logger.info('Fetched user IT-Hilfe offers', {
      userId: session.user.id,
      count: offers.length,
      total,
    })

    return apiSuccess({
      offers,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    logger.error('Error fetching user IT-Hilfe offers', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
