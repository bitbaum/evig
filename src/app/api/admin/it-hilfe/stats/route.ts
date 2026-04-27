import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { itHilfeRequests, repairerProfiles } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { TABLE_NAMES } from '@/config/database'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { REQUEST_STATUS } from '@/config/it-hilfe'
import { REPAIRER_PROFILE_TIER, REPAIRER_STATUS } from '@/config/repairer-status'

// GET /api/admin/it-hilfe/stats - Dashboard statistics
export const GET = withAdmin('it-hilfe-admin', async () => {
  try {
    const [row] = await db
      .select({
        total: sql<number>`count(*)`,
        open: sql<number>`count(*) FILTER (WHERE ${itHilfeRequests.status} = ${REQUEST_STATUS.OPEN})`,
        in_discussion: sql<number>`count(*) FILTER (WHERE ${itHilfeRequests.status} = ${REQUEST_STATUS.IN_DISCUSSION})`,
        matched: sql<number>`count(*) FILTER (WHERE ${itHilfeRequests.status} = ${REQUEST_STATUS.MATCHED})`,
        completed: sql<number>`count(*) FILTER (WHERE ${itHilfeRequests.status} = ${REQUEST_STATUS.COMPLETED})`,
        cancelled: sql<number>`count(*) FILTER (WHERE ${itHilfeRequests.status} = ${REQUEST_STATUS.CANCELLED})`,
        low: sql<number>`count(*) FILTER (WHERE ${itHilfeRequests.urgency} = 'low')`,
        normal: sql<number>`count(*) FILTER (WHERE ${itHilfeRequests.urgency} = 'normal')`,
        high: sql<number>`count(*) FILTER (WHERE ${itHilfeRequests.urgency} = 'high')`,
        urgent: sql<number>`count(*) FILTER (WHERE ${itHilfeRequests.urgency} = 'urgent')`,
        activeHelpers: sql<number>`(SELECT count(*) FROM ${sql.raw(TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES)} WHERE ${repairerProfiles.isActive} = true AND ${repairerProfiles.status} != ${REPAIRER_STATUS.SUSPENDED} AND ${repairerProfiles.profileTier} = ${REPAIRER_PROFILE_TIER.COMMUNITY})`,
        verifiedHelpers: sql<number>`(SELECT count(*) FROM ${sql.raw(TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES)} WHERE ${repairerProfiles.isVerified} = true AND ${repairerProfiles.profileTier} = ${REPAIRER_PROFILE_TIER.COMMUNITY})`,
        totalOffers: sql<number>`(SELECT count(*) FROM ${sql.raw(TABLE_NAMES.IT_HILFE_OFFERS)})`,
      })
      .from(itHilfeRequests)

    const total = Number(row.total)
    const completed = Number(row.completed)

    return apiSuccess({
      total,
      byStatus: {
        open: Number(row.open),
        in_discussion: Number(row.in_discussion),
        matched: Number(row.matched),
        completed,
        cancelled: Number(row.cancelled),
      },
      byUrgency: {
        low: Number(row.low),
        normal: Number(row.normal),
        high: Number(row.high),
        urgent: Number(row.urgent),
      },
      activeHelpers: Number(row.activeHelpers),
      verifiedHelpers: Number(row.verifiedHelpers),
      totalOffers: Number(row.totalOffers),
      resolutionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
