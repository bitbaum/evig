import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { itHilfeRequests, users } from '@/db/schema'
import { eq, and, ilike, or, sql, desc } from 'drizzle-orm'
import { apiError, apiSuccess, parsePagination , hasMoreItems} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'

// GET /api/admin/it-hilfe - List all IT-Hilfe requests with filters
export const GET = withAdmin('it-hilfe-admin', async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const category = searchParams.get('category') || 'all'
    const urgency = searchParams.get('urgency') || 'all'
    const canton = searchParams.get('canton')
    const search = searchParams.get('search')
    const { limit, offset } = parsePagination(request)

    const conditions = []

    if (status !== 'all') {
      conditions.push(eq(itHilfeRequests.status, status))
    }

    if (category !== 'all') {
      conditions.push(eq(itHilfeRequests.categoryId, category))
    }

    if (urgency !== 'all') {
      conditions.push(eq(itHilfeRequests.urgency, urgency))
    }

    if (canton) {
      conditions.push(eq(itHilfeRequests.canton, canton))
    }

    if (search) {
      const pattern = `%${search}%`
      conditions.push(or(
        ilike(itHilfeRequests.title, pattern),
        ilike(itHilfeRequests.description, pattern),
        ilike(users.name, pattern),
      )!)
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    // Requests page + total count (parallel — independent queries)
    const [rows, [countRow]] = await Promise.all([
      db
        .select({
          id: itHilfeRequests.id,
          title: itHilfeRequests.title,
          category_id: itHilfeRequests.categoryId,
          urgency: itHilfeRequests.urgency,
          status: itHilfeRequests.status,
          postal_code: itHilfeRequests.postalCode,
          city: itHilfeRequests.city,
          canton: itHilfeRequests.canton,
          budget_amount_cents: itHilfeRequests.budgetAmountCents,
          budget_type: itHilfeRequests.budgetType,
          offer_count: itHilfeRequests.offerCount,
          admin_notes: itHilfeRequests.adminNotes,
          created_at: itHilfeRequests.createdAt,
          updated_at: itHilfeRequests.updatedAt,
          requester_id: users.id,
          requester_name: users.name,
          requester_email: users.email,
        })
        .from(itHilfeRequests)
        .innerJoin(users, eq(itHilfeRequests.requesterId, users.id))
        .where(where)
        .orderBy(desc(itHilfeRequests.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)` })
        .from(itHilfeRequests)
        .innerJoin(users, eq(itHilfeRequests.requesterId, users.id))
        .where(where),
    ])

    const total = Number(countRow?.total ?? 0)

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
