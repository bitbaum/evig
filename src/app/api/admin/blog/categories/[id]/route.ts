/**
 * API: Single Blog Category
 *
 * GET /api/admin/blog/categories/[id] - Get category details
 * PATCH /api/admin/blog/categories/[id] - Update category
 * DELETE /api/admin/blog/categories/[id] - Delete category
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiBadRequest,
} from '@/lib/api/helpers'

export const GET = withAdmin<{ id: string }>(async (request, session, context) => {
  try {
    const { id } = context!.params!

    const result = await query<{
      id: string
      slug: string
      name: string
      description: string | null
      color: string | null
      sort_order: number
      is_active: boolean
    }>(
      `SELECT id, slug, name, description, color, sort_order, is_active
       FROM ${TABLE_NAMES.BLOG_CATEGORIES}
       WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return apiNotFound('Kategorie')
    }

    return apiSuccess(result.rows[0])
  } catch (error) {
    logger.error('Failed to get blog category', { error })
    return apiError(error, 'Kategorie konnte nicht geladen werden')
  }
})

export const PATCH = withAdmin<{ id: string }>(async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()
    const { name, slug, description, color, sort_order, is_active } = body

    // Check if category exists
    const existing = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.BLOG_CATEGORIES} WHERE id = $1`,
      [id]
    )

    if (existing.rows.length === 0) {
      return apiNotFound('Kategorie')
    }

    // Validation
    if (!name || !slug) {
      return apiBadRequest('Name und Slug sind erforderlich')
    }

    // Check if slug is unique (excluding current category)
    const slugCheck = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.BLOG_CATEGORIES} WHERE slug = $1 AND id != $2`,
      [slug, id]
    )

    if (slugCheck.rows.length > 0) {
      return apiBadRequest('Eine andere Kategorie mit diesem Slug existiert bereits')
    }

    // Update category
    const result = await query<{
      id: string
      slug: string
      name: string
      description: string | null
      color: string | null
      sort_order: number
      is_active: boolean
    }>(
      `UPDATE ${TABLE_NAMES.BLOG_CATEGORIES}
       SET name = $1, slug = $2, description = $3, color = $4, sort_order = $5, is_active = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, slug, description, color, sort_order, is_active`,
      [name, slug, description || null, color || null, sort_order || 0, is_active !== false, id]
    )

    logger.info('Blog category updated', {
      userId: session.user.id,
      categoryId: id,
      slug,
    })

    return apiSuccess(result.rows[0])
  } catch (error) {
    logger.error('Failed to update blog category', { error })
    return apiError(error, 'Kategorie konnte nicht aktualisiert werden')
  }
})

export const DELETE = withAdmin<{ id: string }>(async (request, session, context) => {
  try {
    const { id } = context!.params!

    // Check if category exists
    const existing = await query<{ id: string; name: string }>(
      `SELECT id, name FROM ${TABLE_NAMES.BLOG_CATEGORIES} WHERE id = $1`,
      [id]
    )

    if (existing.rows.length === 0) {
      return apiNotFound('Kategorie')
    }

    // Check if category has posts
    const postsCheck = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.BLOG_POSTS} WHERE category_id = $1`,
      [id]
    )

    const postCount = parseInt(postsCheck.rows[0]?.count || '0')
    if (postCount > 0) {
      return apiBadRequest(
        `Kategorie kann nicht gelöscht werden - ${postCount} Artikel zugewiesen`
      )
    }

    // Delete category
    await query(
      `DELETE FROM ${TABLE_NAMES.BLOG_CATEGORIES} WHERE id = $1`,
      [id]
    )

    logger.info('Blog category deleted', {
      userId: session.user.id,
      categoryId: id,
      categoryName: existing.rows[0].name,
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    logger.error('Failed to delete blog category', { error })
    return apiError(error, 'Kategorie konnte nicht gelöscht werden')
  }
})
