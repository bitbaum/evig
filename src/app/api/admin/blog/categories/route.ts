/**
 * API: Blog Categories
 *
 * GET /api/admin/blog/categories - List categories for dropdown
 * POST /api/admin/blog/categories - Create new category
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiBadRequest,
} from '@/lib/api/helpers'

export const GET = withAdmin('content', async (request, session) => {
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
    logger.error('Failed to list blog categories', { error })
    return apiError(error, 'Kategorien konnten nicht geladen werden')
  }
})

export const POST = withAdmin('content', async (request, session) => {
  try {
    const body = await request.json()
    const { name, slug, description, color, sort_order, is_active } = body

    // Validation
    if (!name || !slug) {
      return apiBadRequest('Name und Slug sind erforderlich')
    }

    // Check if slug already exists
    const existing = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.BLOG_CATEGORIES} WHERE slug = $1`,
      [slug]
    )

    if (existing.rows.length > 0) {
      return apiBadRequest('Eine Kategorie mit diesem Slug existiert bereits')
    }

    // Insert new category
    const result = await query<{
      id: string
      slug: string
      name: string
      description: string | null
      color: string | null
      sort_order: number
      is_active: boolean
    }>(
      `INSERT INTO ${TABLE_NAMES.BLOG_CATEGORIES}
       (name, slug, description, color, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, slug, description, color, sort_order, is_active`,
      [
        name,
        slug,
        description || null,
        color || null,
        sort_order || 0,
        is_active !== false,
      ]
    )

    logger.info('Blog category created', {
      userId: session.user.id,
      categoryId: result.rows[0].id,
      slug,
    })

    return apiSuccess(result.rows[0], 201)
  } catch (error) {
    logger.error('Failed to create blog category', { error })
    return apiError(error, 'Kategorie konnte nicht erstellt werden')
  }
})
