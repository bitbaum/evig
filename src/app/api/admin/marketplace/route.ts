import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { listings, listingReports, users } from '@/db/schema'
import { eq, and, ilike, isNotNull, isNull, sql, or } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { apiError, apiSuccess , hasMoreItems} from '@/lib/api/helpers'
import { TABLE_NAMES } from '@/config/database'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { REPORT_STATUS } from '@/config/report-status'
import { MARKETPLACE_SELLER_TYPE } from '@/config/marketplace'
import { validateQuery, AdminListingsQuerySchema } from '@/lib/schemas'

// GET /api/admin/marketplace - List all listings with admin filters
export const GET = withAdmin('marketplace', async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const validation = validateQuery(AdminListingsQuerySchema, Object.fromEntries(searchParams))
    if (!validation.success) return validation.error

    const { status, category, seller_type, verified, reported, search, limit, offset } = validation.data

    const seller = alias(users, 'seller')

    // Build conditions
    const conditions = []

    if (status !== 'all') {
      conditions.push(eq(listings.status, status))
    }

    if (category) {
      conditions.push(eq(listings.category, category))
    }

    // SSOT: the stored is_revampit column decides — never re-derive from email
    // (staff selling privately are P2P sellers).
    if (seller_type === MARKETPLACE_SELLER_TYPE.REVAMPIT) {
      conditions.push(eq(listings.isRevampit, true))
    } else if (seller_type === MARKETPLACE_SELLER_TYPE.COMMUNITY) {
      conditions.push(eq(listings.isRevampit, false))
    }

    if (verified === 'yes') {
      conditions.push(isNotNull(listings.verifiedAt))
    } else if (verified === 'no') {
      conditions.push(isNull(listings.verifiedAt))
    }

    if (reported === 'yes') {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${sql.raw(TABLE_NAMES.LISTING_REPORTS)} lr WHERE lr.listing_id = ${listings.id} AND lr.status = ${REPORT_STATUS.PENDING})`
      )
    }

    if (search) {
      const pattern = `%${search}%`
      conditions.push(or(
        ilike(listings.title, pattern),
        ilike(seller.name, pattern),
        ilike(seller.email, pattern),
      )!)
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    // Listings page + total count (parallel — independent queries)
    const [rows, [countRow]] = await Promise.all([
      db
        .select({
          id: listings.id,
          title: listings.title,
          price_chf: listings.priceChf,
          category: listings.category,
          condition: listings.condition,
          status: listings.status,
          is_revampit: listings.isRevampit,
          verified_at: listings.verifiedAt,
          admin_notes: listings.adminNotes,
          created_at: listings.createdAt,
          seller_id: listings.sellerId,
          seller_name: seller.name,
          seller_email: seller.email,
          report_count: sql<number>`(SELECT COUNT(*) FROM ${sql.raw(TABLE_NAMES.LISTING_REPORTS)} lr WHERE lr.listing_id = ${listings.id} AND lr.status = ${REPORT_STATUS.PENDING})`,
        })
        .from(listings)
        .innerJoin(seller, eq(listings.sellerId, seller.id))
        .where(where)
        .orderBy(sql`${listings.createdAt} DESC`)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)` })
        .from(listings)
        .innerJoin(seller, eq(listings.sellerId, seller.id))
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
