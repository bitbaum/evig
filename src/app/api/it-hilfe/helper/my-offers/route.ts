import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { itHilfeOffers, itHilfeRequests } from '@/db/schema'
import { apiError, apiSuccess, parsePagination , hasMoreItems} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { IT_HILFE_PAGINATION } from '@/config/it-hilfe'
import { logger } from '@/lib/logger'

const oTable = getTableName(itHilfeOffers)
const rTable = getTableName(itHilfeRequests)

/**
 * GET /api/it-hilfe/helper/my-offers
 * Returns offers submitted by the authenticated helper, with request details.
 *
 * @deprecated Orphaned — zero src/ callers as of QQQ.3. URL also breaks
 * REST convention (singular `helper/` under plural namespace). The same
 * data is available via /api/it-hilfe/my-offers (which IS used). When
 * a real consumer appears, port it to /api/it-hilfe/me/offers (planned
 * canonical URL). Tracked in docs/DEAD_CODE.md.
 */
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const { limit, offset } = parsePagination(request, IT_HILFE_PAGINATION)

    const result = await db.execute(sql`
      SELECT
        COUNT(*) OVER() AS _total_count,
        o.id AS offer_id,
        o.status AS offer_status,
        o.message AS offer_message,
        o.proposed_compensation,
        o.estimated_time,
        o.relevant_skills,
        o.created_at AS offer_created_at,
        r.id AS request_id,
        r.title AS request_title,
        r.category_id,
        r.urgency,
        r.budget_tier,
        r.city,
        r.canton,
        r.status AS request_status,
        r.created_at AS request_created_at
      FROM ${sql.raw(oTable)} o
      JOIN ${sql.raw(rTable)} r ON o.request_id = r.id
      WHERE o.helper_id = ${session.user.id}
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    type Row = Record<string, unknown>
    const rawRows = result.rows as Row[]
    const total = rawRows.length > 0
      ? parseInt(String(rawRows[0]._total_count || '0'), 10)
      : 0

    const offers = rawRows.map(row => ({
      id: row.offer_id,
      status: row.offer_status,
      message: row.offer_message,
      proposedCompensation: row.proposed_compensation,
      estimatedTime: row.estimated_time,
      relevantSkills: row.relevant_skills || [],
      createdAt: row.offer_created_at,
      request: {
        id: row.request_id,
        title: row.request_title,
        categoryId: row.category_id,
        urgency: row.urgency,
        budgetTier: row.budget_tier,
        city: row.city,
        canton: row.canton,
        status: row.request_status,
        createdAt: row.request_created_at,
      },
    }))

    logger.info('Fetched helper offers', {
      helperId: session.user.id,
      offerCount: offers.length,
      total,
    })

    return apiSuccess({
      offers,
      total,
      pagination: { limit, offset, hasMore: hasMoreItems(offset, limit, total) },
    })
  } catch (error) {
    logger.error('Error fetching helper offers', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
