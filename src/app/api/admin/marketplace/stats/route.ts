import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
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
        COUNT(*) FILTER (WHERE l.status = 'active') as active,
        COUNT(*) FILTER (WHERE l.status = 'sold') as sold,
        COUNT(*) FILTER (WHERE l.status = 'draft') as draft,
        COUNT(*) FILTER (WHERE l.status = 'reserved') as reserved,
        COUNT(*) FILTER (WHERE l.status = 'removed') as removed,
        COUNT(*) FILTER (WHERE l.verified_at IS NOT NULL) as verified,
        COUNT(*) FILTER (WHERE l.verified_at IS NULL AND l.status = 'active') as unverified,
        COUNT(*) FILTER (WHERE l.is_revampit = true) as revampit,
        COUNT(*) FILTER (WHERE l.is_revampit = false) as community,
        (SELECT COUNT(*) FROM ${TABLE_NAMES.LISTING_REPORTS} WHERE status = '${REPORT_STATUS.PENDING}') as open_reports,
        (SELECT COUNT(*) FROM ${TABLE_NAMES.MARKETPLACE_ORDERS}) as total_orders,
        (SELECT COALESCE(SUM(amount_chf * 100), 0) FROM ${TABLE_NAMES.MARKETPLACE_ORDERS} WHERE status IN ('paid', 'shipped', 'delivered', 'completed')) as revenue_cents
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
