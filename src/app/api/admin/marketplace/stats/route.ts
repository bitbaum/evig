import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { listings, listingReports, marketplaceOrders } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { TABLE_NAMES } from '@/config/database'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { LISTING_STATUS, ORDER_STATUS } from '@/config/marketplace'
import { REPORT_STATUS } from '@/config/report-status'

// GET /api/admin/marketplace/stats - Dashboard statistics
export const GET = withAdmin('marketplace', async () => {
  try {
    // SSOT: the stored is_revampit column decides — never re-derive from email
    // (staff selling privately are P2P sellers).
    const [row] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) FILTER (WHERE ${listings.status} = ${LISTING_STATUS.ACTIVE})`,
        sold: sql<number>`count(*) FILTER (WHERE ${listings.status} = ${LISTING_STATUS.SOLD})`,
        draft: sql<number>`count(*) FILTER (WHERE ${listings.status} = ${LISTING_STATUS.DRAFT})`,
        reserved: sql<number>`count(*) FILTER (WHERE ${listings.status} = ${LISTING_STATUS.RESERVED})`,
        removed: sql<number>`count(*) FILTER (WHERE ${listings.status} = ${LISTING_STATUS.REMOVED})`,
        verified: sql<number>`count(*) FILTER (WHERE ${listings.verifiedAt} IS NOT NULL)`,
        unverified: sql<number>`count(*) FILTER (WHERE ${listings.verifiedAt} IS NULL AND ${listings.status} = ${LISTING_STATUS.ACTIVE})`,
        revampit: sql<number>`count(*) FILTER (WHERE ${listings.isRevampit} = true)`,
        community: sql<number>`count(*) FILTER (WHERE ${listings.isRevampit} = false)`,
        openReports: sql<number>`(SELECT count(*) FROM ${sql.raw(TABLE_NAMES.LISTING_REPORTS)} WHERE ${listingReports.status} = ${REPORT_STATUS.PENDING})`,
        totalOrders: sql<number>`(SELECT count(*) FROM ${sql.raw(TABLE_NAMES.MARKETPLACE_ORDERS)})`,
        revenueCents: sql<number>`(SELECT COALESCE(SUM(${marketplaceOrders.amountChf}::numeric * 100), 0) FROM ${sql.raw(TABLE_NAMES.MARKETPLACE_ORDERS)} WHERE ${marketplaceOrders.status} IN (${ORDER_STATUS.PAID}, ${ORDER_STATUS.SHIPPED}, ${ORDER_STATUS.DELIVERED}, ${ORDER_STATUS.COMPLETED}))`,
      })
      .from(listings)

    return apiSuccess({
      total: Number(row.total),
      byStatus: {
        active: Number(row.active),
        sold: Number(row.sold),
        draft: Number(row.draft),
        reserved: Number(row.reserved),
        removed: Number(row.removed),
      },
      verified: Number(row.verified),
      unverified: Number(row.unverified),
      revampit: Number(row.revampit),
      community: Number(row.community),
      openReports: Number(row.openReports),
      totalOrders: Number(row.totalOrders),
      revenueCents: Number(row.revenueCents),
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
