/**
 * Live aggregate impact metrics — devices, CO₂ avoided, etc.
 *
 * Computed from `listings` rows joined with our category → CO₂ mapping.
 * Falls back to static `org-numbers.defaults.ts` values when the DB is
 * unavailable, with `live: false` so callers can show a "based on
 * estimates" tag.
 *
 * Server-only. Used by:
 *   - <ImpactStatsSection> on /about/impact (full layout)
 *   - <MissionStrip>      on /shop + /marketplace (compact above-the-fold)
 *
 * Single source of truth ensures the homepage stat, the methodology
 * page, and the commerce strip all show the same number.
 */

import 'server-only'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { LISTING_STATUS } from '@/config/marketplace'
import { estimateCO2Savings } from '@/config/co2-impact'
import { getDefaultNumeric } from '@/lib/org-numbers.defaults'
import { logger } from '@/lib/logger'

export interface ImpactStats {
  totalDevices: number
  soldDevices: number
  /** Tonnes CO₂e avoided, rounded to 1 decimal. */
  co2SavedTons: number
  /** Exact kg CO₂e avoided — use with co2DisplayValue() so small totals show as kg, not "0 t". */
  co2SavedKg: number
  repairs: number
  users: number
  /** `true` when computed live from the DB; `false` when DB was unavailable and defaults were used. */
  live: boolean
}

export async function fetchImpactStats(): Promise<ImpactStats> {
  try {
    const [listingRows, repairRows, userRows] = await Promise.all([
      query<{ category: string; status: string; count: string }>(
        `SELECT category, status, COUNT(*) as count
         FROM ${TABLE_NAMES.LISTINGS}
         WHERE status != '${LISTING_STATUS.REMOVED}'
         GROUP BY category, status`,
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.IT_HILFE_REQUESTS}`,
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS}`,
      ),
    ])

    let totalDevices = 0
    let soldDevices = 0
    let co2SavedKg = 0

    for (const row of listingRows.rows) {
      const count = Number(row.count)
      totalDevices += count
      if (row.status === LISTING_STATUS.SOLD) {
        soldDevices += count
        // SSOT: ADEME-based per-category factor. Categories without a
        // defensible factor contribute NOTHING (conservative under-count).
        const perDevice = estimateCO2Savings(row.category)
        if (perDevice) co2SavedKg += count * perDevice
      }
    }

    return {
      totalDevices,
      soldDevices,
      co2SavedTons: Math.round((co2SavedKg / 1000) * 10) / 10,
      co2SavedKg,
      repairs: Number(repairRows.rows[0]?.count || 0),
      users: Number(userRows.rows[0]?.count || 0),
      live: true,
    }
  } catch (error) {
    logger.warn('fetchImpactStats: DB unavailable, using defaults', { error })
    return {
      totalDevices: getDefaultNumeric('devices_sold_per_year'),
      soldDevices: getDefaultNumeric('devices_sold_per_year'),
      co2SavedTons: getDefaultNumeric('annual_co2_saved_tons'),
      co2SavedKg: getDefaultNumeric('annual_co2_saved_tons') * 1000,
      repairs: 0,
      users: 0,
      live: false,
    }
  }
}
