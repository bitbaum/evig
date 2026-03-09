import { db } from '@/db'
import { listingReports, listings, users } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateQuery, AdminReportsQuerySchema } from '@/lib/schemas'

const reporter = alias(users, 'reporter')
const seller = alias(users, 'seller')

// GET /api/admin/marketplace/reports - List all reports
export const GET = withAdmin('marketplace', async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const validation = validateQuery(AdminReportsQuerySchema, Object.fromEntries(searchParams))
    if (!validation.success) return validation.error

    const { status, limit, offset } = validation.data

    const conditions: SQL[] = []
    if (status !== 'all') {
      conditions.push(eq(listingReports.status, status))
    }

    const where = conditions.length > 0 ? conditions[0] : undefined

    // Count total
    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(listingReports)
      .where(where)

    const total = Number(countRow?.count ?? 0)

    // Fetch reports with joins
    const rows = await db
      .select({
        id: listingReports.id,
        reason: listingReports.reason,
        details: listingReports.details,
        status: listingReports.status,
        created_at: listingReports.createdAt,
        reviewed_at: listingReports.reviewedAt,
        resolution_notes: listingReports.resolutionNotes,
        resolution_action: listingReports.resolutionAction,
        listing_id: listings.id,
        listing_title: listings.title,
        listing_status: listings.status,
        reporter_name: reporter.name,
        reporter_email: reporter.email,
        seller_name: seller.name,
        seller_email: seller.email,
      })
      .from(listingReports)
      .innerJoin(listings, eq(listingReports.listingId, listings.id))
      .innerJoin(reporter, eq(listingReports.reporterId, reporter.id))
      .innerJoin(seller, eq(listings.sellerId, seller.id))
      .where(where)
      .orderBy(desc(listingReports.createdAt))
      .limit(limit)
      .offset(offset)

    return apiSuccess({
      items: rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
