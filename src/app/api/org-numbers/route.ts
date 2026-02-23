import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { apiBadRequest, apiError } from '@/lib/api/helpers'
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

      return NextResponse.json({
        success: true,
        data: filtered,
        meta: { source: 'defaults', count: filtered.length }
      })
    }

    return NextResponse.json({
      success: true,
      data: numbers,
      meta: { source: 'database', count: numbers.length }
    })
  } catch (error) {
    return apiError(error, 'Serverfehler')
  }
}
