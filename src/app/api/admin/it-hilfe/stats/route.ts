import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'

// GET /api/admin/it-hilfe/stats - Dashboard statistics
export const GET = withAdmin('it-hilfe-admin', async () => {
  try {
    const result = await query<{
      total: string
      open: string
      in_discussion: string
      matched: string
      completed: string
      cancelled: string
      low: string
      normal: string
      high: string
      urgent: string
      active_helpers: string
      verified_helpers: string
      total_offers: string
    }>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE r.status = 'open') as open,
        COUNT(*) FILTER (WHERE r.status = 'in_discussion') as in_discussion,
        COUNT(*) FILTER (WHERE r.status = 'matched') as matched,
        COUNT(*) FILTER (WHERE r.status = 'completed') as completed,
        COUNT(*) FILTER (WHERE r.status = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE r.urgency = 'low') as low,
        COUNT(*) FILTER (WHERE r.urgency = 'normal') as normal,
        COUNT(*) FILTER (WHERE r.urgency = 'high') as high,
        COUNT(*) FILTER (WHERE r.urgency = 'urgent') as urgent,
        (SELECT COUNT(*) FROM ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} WHERE is_active = true AND suspended_at IS NULL) as active_helpers,
        (SELECT COUNT(*) FROM ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} WHERE is_verified = true) as verified_helpers,
        (SELECT COUNT(*) FROM ${TABLE_NAMES.IT_HILFE_OFFERS}) as total_offers
      FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} r`
    )

    const row = result.rows[0]
    const total = parseInt(row.total)
    const completed = parseInt(row.completed)

    return apiSuccess({
      total,
      byStatus: {
        open: parseInt(row.open),
        in_discussion: parseInt(row.in_discussion),
        matched: parseInt(row.matched),
        completed,
        cancelled: parseInt(row.cancelled),
      },
      byUrgency: {
        low: parseInt(row.low),
        normal: parseInt(row.normal),
        high: parseInt(row.high),
        urgent: parseInt(row.urgent),
      },
      activeHelpers: parseInt(row.active_helpers),
      verifiedHelpers: parseInt(row.verified_helpers),
      totalOffers: parseInt(row.total_offers),
      resolutionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
