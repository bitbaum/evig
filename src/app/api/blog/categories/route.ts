/**
 * API: Public Blog Categories
 *
 * GET /api/blog/categories - List active categories for public use
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError } from '@/lib/api/helpers'

export async function GET() {
  try {
    const result = await query<{
      id: string
      slug: string
      name: string
      description: string | null
      color: string | null
    }>(
      `SELECT id, slug, name, description, color
       FROM ${TABLE_NAMES.BLOG_CATEGORIES}
       WHERE is_active = true
       ORDER BY sort_order, name`
    )

    return apiSuccess(result.rows)
  } catch (error) {
    logger.error('Failed to fetch public blog categories', { error })
    return apiError(error, 'Kategorien konnten nicht geladen werden')
  }
}
