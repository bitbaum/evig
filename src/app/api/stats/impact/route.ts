import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { CATEGORY_WEIGHT_KG, CO2_PER_KG, FALLBACK_DEVICE_WEIGHT_KG } from '@/config/co2-impact'
import { logger } from '@/lib/logger'
import { apiSuccessCached, apiError } from '@/lib/api/helpers'
import { LISTING_STATUS } from '@/config/marketplace'

export const revalidate = 3600 // Cache for 1 hour

/**
 * GET /api/stats/impact
 * Returns live impact metrics computed from DB data.
 * No auth required — public transparency data.
 */
export async function GET() {
  try {
    const [listingRows, repairRows, userRows] = await Promise.all([
      // All marketplace listings (unified store: P2P + RevampIT shop, the latter
      // carries is_revampit=true). Count by category + status for CO2 computation.
      query<{ category: string; status: string; count: string }>(
        `SELECT category, status, COUNT(*) as count
         FROM ${TABLE_NAMES.LISTINGS}
         WHERE status != '${LISTING_STATUS.REMOVED}'
         GROUP BY category, status`
      ),
      // IT-Hilfe repairs
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.IT_HILFE_REQUESTS}`
      ),
      // Registered users
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS}`
      ),
    ])

    // Compute totals from listing rows
    let totalDevices = 0
    let soldDevices = 0
    let co2SavedKg = 0

    for (const row of listingRows.rows) {
      const count = Number(row.count)
      totalDevices += count

      if (row.status === LISTING_STATUS.SOLD) {
        soldDevices += count
        const weightKg = CATEGORY_WEIGHT_KG[row.category] ?? FALLBACK_DEVICE_WEIGHT_KG
        co2SavedKg += Math.round(count * weightKg * CO2_PER_KG)
      }
    }

    const co2SavedTons = Math.round((co2SavedKg / 1000) * 10) / 10

    // Impact data is public transparency data; changes hourly at most — cache 1h, stale 5 min
    return apiSuccessCached({
      devices: {
        total: totalDevices,
        sold: soldDevices,
      },
      co2: {
        savedKg: co2SavedKg,
        savedTons: co2SavedTons,
      },
      repairs: Number(repairRows.rows[0]?.count || 0),
      users: Number(userRows.rows[0]?.count || 0),
      meta: { source: 'database', computedAt: new Date().toISOString() },
    }, 3600, 300)
  } catch (error) {
    logger.error('Failed to compute impact stats', { error })
    return apiError(error, 'Impact-Statistiken konnten nicht geladen werden')
  }
}
