import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { LISTING_STATUS, ORDER_STATUS } from '@/config/marketplace'
import { REPORT_STATUS } from '@/config/report-status'

// GET /api/admin/marketplace/stats - Dashboard statistics
export const GET = withAdmin('marketplace', async () => {
  try {
    const result = await query<{
      total: string
      active: string
      sold: string
      draft: string
      reserved: string
      removed: string
      verified: string
      unverified: string
      revampit: string
      community: string
      open_reports: string
      total_orders: string
      revenue_cents: string
    }>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE l.status = '${LISTING_STATUS.ACTIVE}') as active,
        COUNT(*) FILTER (WHERE l.status = '${LISTING_STATUS.SOLD}') as sold,
        COUNT(*) FILTER (WHERE l.status = '${LISTING_STATUS.DRAFT}') as draft,
        COUNT(*) FILTER (WHERE l.status = '${LISTING_STATUS.RESERVED}') as reserved,
        COUNT(*) FILTER (WHERE l.status = '${LISTING_STATUS.REMOVED}') as removed,
        COUNT(*) FILTER (WHERE l.verified_at IS NOT NULL) as verified,
        COUNT(*) FILTER (WHERE l.verified_at IS NULL AND l.status = '${LISTING_STATUS.ACTIVE}') as unverified,
        COUNT(*) FILTER (WHERE l.is_revampit = true) as revampit,
        COUNT(*) FILTER (WHERE l.is_revampit = false) as community,
        (SELECT COUNT(*) FROM ${TABLE_NAMES.LISTING_REPORTS} WHERE status = '${REPORT_STATUS.PENDING}') as open_reports,
        (SELECT COUNT(*) FROM ${TABLE_NAMES.MARKETPLACE_ORDERS}) as total_orders,
        (SELECT COALESCE(SUM(amount_chf * 100), 0) FROM ${TABLE_NAMES.MARKETPLACE_ORDERS} WHERE status IN ('${ORDER_STATUS.PAID}', '${ORDER_STATUS.SHIPPED}', '${ORDER_STATUS.DELIVERED}', '${ORDER_STATUS.COMPLETED}')) as revenue_cents
      FROM ${TABLE_NAMES.LISTINGS} l`
    )

    const row = result.rows[0]
    return apiSuccess({
      total: parseInt(row.total),
      byStatus: {
        active: parseInt(row.active),
        sold: parseInt(row.sold),
        draft: parseInt(row.draft),
        reserved: parseInt(row.reserved),
        removed: parseInt(row.removed),
      },
      verified: parseInt(row.verified),
      unverified: parseInt(row.unverified),
      revampit: parseInt(row.revampit),
      community: parseInt(row.community),
      openReports: parseInt(row.open_reports),
      totalOrders: parseInt(row.total_orders),
      revenueCents: parseInt(row.revenue_cents),
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
