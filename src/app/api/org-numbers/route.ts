import type { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { apiSuccessCached, apiBadRequest, apiError } from '@/lib/api/helpers'
import { getOrgNumbers, ORG_NUMBERS_DEFAULTS, type OrgNumberCategory } from '@/lib/org-numbers'

const VALID_CATEGORIES: OrgNumberCategory[] = ['impact', 'social', 'economic', 'operations']

/**
 * GET /api/org-numbers
 * Returns organizational numbers, optionally filtered by category.
 *
 * Query params:
 *   ?category=impact|social|economic|operations
 *
 * Falls back to static defaults if DB is unavailable.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as OrgNumberCategory | null

    if (category && !VALID_CATEGORIES.includes(category)) {
      return apiBadRequest(`Ungültige Kategorie. Erlaubt: ${VALID_CATEGORIES.join(', ')}`)
    }

    const numbers = await getOrgNumbers(category ?? undefined)

    // Fall back to defaults if DB returned nothing
    if (numbers.length === 0) {
      const defaults = Object.values(ORG_NUMBERS_DEFAULTS)
      const filtered = category
        ? defaults.filter(n => n.category === category)
        : defaults

      // Org numbers are stable, public data — cache 5 min, stale 1 min
      return apiSuccessCached({
        items: filtered,
        meta: { source: 'defaults', count: filtered.length }
      }, 300, 60)
    }

    // Org numbers are stable, public data — cache 5 min, stale 1 min
    return apiSuccessCached({
      items: numbers,
      meta: { source: 'database', count: numbers.length }
    }, 300, 60)
  } catch (error) {
    return apiError(error, 'Serverfehler')
  }
}
