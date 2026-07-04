import { db } from '@/db'
import { listingQuestions, listings, users } from '@/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess, hasMoreItems } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateQuery, AdminQuestionsQuerySchema } from '@/lib/schemas'

const asker = alias(users, 'asker')
const seller = alias(users, 'seller')

// GET /api/admin/marketplace/questions - List marketplace Q&A for moderation
export const GET = withAdmin('marketplace', async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const validation = validateQuery(AdminQuestionsQuerySchema, Object.fromEntries(searchParams))
    if (!validation.success) return validation.error

    const { status, limit, offset } = validation.data
    const conditions: SQL[] = []
    if (status !== 'all') {
      conditions.push(eq(listingQuestions.status, status))
    }
    const where = conditions.length > 0 ? conditions[0] : undefined

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(listingQuestions)
      .where(where)

    const total = Number(countRow?.count ?? 0)

    const rows = await db
      .select({
        id: listingQuestions.id,
        question: listingQuestions.question,
        answer: listingQuestions.answer,
        status: listingQuestions.status,
        created_at: listingQuestions.createdAt,
        answered_at: listingQuestions.answeredAt,
        listing_id: listings.id,
        listing_title: listings.title,
        asker_name: asker.name,
        asker_email: asker.email,
        seller_name: seller.name,
        seller_email: seller.email,
      })
      .from(listingQuestions)
      .innerJoin(listings, eq(listingQuestions.listingId, listings.id))
      .innerJoin(asker, eq(listingQuestions.askerId, asker.id))
      .innerJoin(seller, eq(listings.sellerId, seller.id))
      .where(where)
      .orderBy(desc(listingQuestions.createdAt))
      .limit(limit)
      .offset(offset)

    return apiSuccess({
      items: rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: hasMoreItems(offset, limit, total),
      },
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
