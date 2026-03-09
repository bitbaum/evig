import { apiError, apiSuccess } from '@/lib/api/helpers'
import { loadFinancialData, getAvailableYears } from '@/lib/hirn/data/financial-loader'
import { logger } from '@/lib/logger'

/**
 * Public financial transparency API
 * Returns yearly aggregates stripped of internal tracing metadata.
 * No auth required — this data is public by design (mission: transparency).
 */
export async function GET() {
  try {
    const years = await getAvailableYears()
    // Show last 5 years for public page
    const recentYears = years.slice(0, 5)

    const yearlyData = await Promise.all(
      recentYears.map(async (year) => {
        const data = await loadFinancialData(year)
        if (!data) return null

        return {
          year: data.year,
          totals: {
            total: data.totals.total.value,
            warenverkauf: data.totals.warenverkauf.value,
            dienstleistungen: data.totals.dienstleistungen.value,
            integration: data.totals.integration.value,
            spenden: data.totals.spenden.value,
            aufstockung: data.totals.aufstockung.value,
          },
          derived: {
            eigenfinanzierungPct: Math.round(data.derived.eigenfinanzierungPct.value * 10) / 10,
            earnedTotal: data.derived.earnedTotal.value,
            donationsTotal: data.derived.donationsTotal.value,
          },
        }
      })
    )

    return apiSuccess(yearlyData.filter(Boolean))
  } catch (error) {
    logger.error('Failed to load public financials', { error })
    return apiError(error, 'Finanzdaten konnten nicht geladen werden')
  }
}
