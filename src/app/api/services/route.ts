/**
 * API: Public Services
 *
 * GET /api/services - List active services from database
 */

import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError } from '@/lib/api/helpers'

export async function GET(request: NextRequest) {
  try {
    const result = await query<{
      id: string
      slug: string
      name: string
      description: string
      hero_title: string | null
      hero_subtitle: string | null
      hero_description: string | null
      icon: string
      price_display: string | null
      price_details: string[] | null
      is_active: boolean
      sort_order: number
    }>(
      `SELECT
        id, slug, name, description,
        hero_title, hero_subtitle, hero_description,
        icon, price_display, price_details,
        is_active, sort_order
      FROM ${TABLE_NAMES.SERVICES}
      WHERE is_active = true
      ORDER BY sort_order, name`
    )

    return apiSuccess(result.rows)
  } catch (error) {
    logger.error('Failed to list services', { error })
    return apiError(error, 'Services konnten nicht geladen werden')
  }
}
