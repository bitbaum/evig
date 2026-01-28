/**
 * API: Blog Categories
 *
 * GET /api/admin/blog/categories - List categories for dropdown
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api/helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

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
       ORDER BY name`
    )

    return apiSuccess(result.rows)
  } catch (error) {
    logger.error('Failed to list blog categories', { error })
    return apiError(error, 'Kategorien konnten nicht geladen werden')
  }
}
