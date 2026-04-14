import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { itHilfeRequests, itHilfeOffers, userSkills } from '@/db/schema'
import { users } from '@/db/schema/auth'
import { apiError, apiSuccess, parsePagination } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { getCategoryIds, URGENCY_LEVELS, REQUEST_STATUS } from '@/config/it-hilfe'

const rTable = getTableName(itHilfeRequests)
const oTable = getTableName(itHilfeOffers)
const sTable = getTableName(userSkills)
const uTable = getTableName(users)

/**
 * GET /api/it-hilfe/helper/matching-requests
 * Returns open requests matching the helper's skills, excluding already-offered ones
 */
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url)
    const { limit, offset } = parsePagination(request, { defaultLimit: 20, maxLimit: 50 })

    // Optional filters
    const category = searchParams.get('category')
    const urgency = searchParams.get('urgency')
    const canton = searchParams.get('canton')

    // 1. Get helper's skill IDs
    const skillRows = await db.execute(sql`
      SELECT skill_id FROM ${sql.raw(sTable)}
      WHERE user_id = ${session.user.id}
    `)

    const helperSkills = skillRows.rows.map((r: Record<string, unknown>) => r.skill_id as string)

    if (helperSkills.length === 0) {
      return apiSuccess({
        requests: [],
        total: 0,
        pagination: { limit, offset, hasMore: false },
      })
    }

    // 2. Build WHERE conditions
    const conditions = [
      sql`r.status = ${REQUEST_STATUS.OPEN}`,
      sql`r.expires_at > NOW()`,
      // Skills overlap: request's skills_needed overlaps with helper's skills
      sql`r.skills_needed && ARRAY[${sql.join(helperSkills.map(s => sql`${s}`), sql`, `)}]::text[]`,
      // Exclude requests already offered by this helper
      sql`o.id IS NULL`,
    ]

    if (category && getCategoryIds().includes(category)) {
      conditions.push(sql`r.category_id = ${category}`)
    }
    if (urgency && URGENCY_LEVELS.some(u => u.id === urgency)) {
      conditions.push(sql`r.urgency = ${urgency}`)
    }
    if (canton) {
      conditions.push(sql`r.canton = ${canton}`)
    }

    const whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`

    const result = await db.execute(sql`
      SELECT
        COUNT(*) OVER() AS _total_count,
        r.id, r.title, r.description, r.category_id, r.device_brand, r.device_model,
        r.urgency, r.budget_type, r.budget_amount_cents, r.budget_tier,
        r.city, r.canton, r.service_type, r.skills_needed,
        r.offer_count, r.created_at,
        u.name AS requester_name
      FROM ${sql.raw(rTable)} r
      JOIN ${sql.raw(uTable)} u ON r.requester_id = u.id
      LEFT JOIN ${sql.raw(oTable)} o
        ON o.request_id = r.id AND o.helper_id = ${session.user.id}
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    type Row = Record<string, unknown>
    const rawRows = result.rows as Row[]
    const total = rawRows.length > 0
      ? parseInt(String(rawRows[0]._total_count || '0'), 10)
      : 0

    const requests = rawRows.map(row => ({
      id: row.id,
      title: row.title,
      description: typeof row.description === 'string'
        ? row.description.slice(0, 200)
        : '',
      categoryId: row.category_id,
      deviceBrand: row.device_brand,
      deviceModel: row.device_model,
      urgency: row.urgency,
      budgetType: row.budget_type,
      budgetAmountCents: row.budget_amount_cents,
      budgetTier: row.budget_tier,
      city: row.city,
      canton: row.canton,
      serviceType: row.service_type,
      skillsNeeded: row.skills_needed || [],
      offerCount: row.offer_count,
      createdAt: row.created_at,
      requesterName: row.requester_name,
    }))

    logger.info('Fetched matching requests for helper', {
      helperId: session.user.id,
      skillCount: helperSkills.length,
      matchCount: requests.length,
      total,
    })

    return apiSuccess({
      requests,
      total,
      pagination: { limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    logger.error('Error fetching matching requests', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
