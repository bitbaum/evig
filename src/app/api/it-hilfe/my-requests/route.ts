import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { itHilfeRequests } from '@/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { apiError, apiSuccess, parsePagination , hasMoreItems} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { IT_HILFE_PAGINATION } from '@/config/it-hilfe'
import { logger } from '@/lib/logger'

/**
 * GET /api/it-hilfe/my-requests
 * Get current user's IT-Hilfe requests
 */
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const { limit, offset } = parsePagination(request, IT_HILFE_PAGINATION)

    const conditions = [eq(itHilfeRequests.requesterId, session.user.id)]

    if (status) {
      conditions.push(eq(itHilfeRequests.status, status))
    }

    const where = and(...conditions)

    const rows = await db
      .select({
        _total: sql<number>`count(*) over()`,
        id: itHilfeRequests.id,
        categoryId: itHilfeRequests.categoryId,
        deviceBrand: itHilfeRequests.deviceBrand,
        deviceModel: itHilfeRequests.deviceModel,
        title: itHilfeRequests.title,
        description: itHilfeRequests.description,
        urgency: itHilfeRequests.urgency,
        budgetType: itHilfeRequests.budgetType,
        budgetAmountCents: itHilfeRequests.budgetAmountCents,
        postalCode: itHilfeRequests.postalCode,
        city: itHilfeRequests.city,
        canton: itHilfeRequests.canton,
        serviceType: itHilfeRequests.serviceType,
        skillsNeeded: itHilfeRequests.skillsNeeded,
        imageUrls: itHilfeRequests.imageUrls,
        status: itHilfeRequests.status,
        matchedOfferId: itHilfeRequests.matchedOfferId,
        offerCount: itHilfeRequests.offerCount,
        expiresAt: itHilfeRequests.expiresAt,
        createdAt: itHilfeRequests.createdAt,
        updatedAt: itHilfeRequests.updatedAt,
      })
      .from(itHilfeRequests)
      .where(where)
      .orderBy(desc(itHilfeRequests.createdAt))
      .limit(limit)
      .offset(offset)

    const total = Number(rows[0]?._total ?? 0)
    const requests = rows.map(({ _total, ...row }) => ({
      ...row,
      skillsNeeded: row.skillsNeeded || [],
      imageUrls: row.imageUrls || [],
    }))

    logger.info('Fetched user IT-Hilfe requests', {
      userId: session.user.id,
      count: requests.length,
      total,
    })

    return apiSuccess({
      requests,
      total,
      pagination: {
        limit,
        offset,
        hasMore: hasMoreItems(offset, limit, total),
      },
    })
  } catch (error) {
    logger.error('Error fetching user IT-Hilfe requests', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
