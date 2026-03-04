/**
 * API: Admin Blog Post by ID
 *
 * GET /api/admin/blog/[id] - Get single post
 * PATCH /api/admin/blog/[id] - Update post
 * DELETE /api/admin/blog/[id] - Delete post
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'

export const GET = withAdmin<{ id: string }>('content', async (request, session, context) => {
  const { id: postId } = context!.params!

  try {
    const result = await query<{
      id: string
      slug: string
      title: string
      excerpt: string | null
      content: string
      featured_image: string | null
      category_id: string | null
      category_name: string | null
      tags: string[]
      is_published: boolean
      published_at: string | null
      seo_title: string | null
      seo_description: string | null
      created_at: string
      updated_at: string
    }>(
      `SELECT
        bp.id, bp.slug, bp.title, bp.excerpt, bp.content,
        bp.featured_image, bp.category_id,
        c.name as category_name,
        bp.tags, bp.is_published, bp.published_at,
        bp.seo_title, bp.seo_description,
        bp.created_at, bp.updated_at
      FROM ${TABLE_NAMES.BLOG_POSTS} bp
      LEFT JOIN ${TABLE_NAMES.BLOG_CATEGORIES} c ON bp.category_id = c.id
      WHERE bp.id = $1`,
      [postId]
    )

    if (result.rows.length === 0) {
      return apiNotFound('Blog-Artikel')
    }

    return apiSuccess(result.rows[0])
  } catch (error) {
    logger.error('Failed to get blog post', { postId, error })
    return apiError(error, 'Blog-Artikel konnte nicht geladen werden')
  }
})

export const PATCH = withAdmin<{ id: string }>('content', async (request, session, context) => {
  const { id: postId } = context!.params!

  try {
    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      categoryId,
      tags,
      isPublished,
      seoTitle,
      seoDescription,
    } = body

    // Check if post exists
    const existing = await query<{ id: string; is_published: boolean }>(
      `SELECT id, is_published FROM ${TABLE_NAMES.BLOG_POSTS} WHERE id = $1`,
      [postId]
    )

    if (existing.rows.length === 0) {
      return apiNotFound('Blog-Artikel')
    }

    const wasPublished = existing.rows[0].is_published

    // If slug is changed, check uniqueness
    if (slug) {
      const slugCheck = await query(
        `SELECT id FROM ${TABLE_NAMES.BLOG_POSTS} WHERE slug = $1 AND id != $2`,
        [slug, postId]
      )

      if (slugCheck.rows.length > 0) {
        return apiBadRequest('Ein Artikel mit diesem Slug existiert bereits')
      }
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`)
      values.push(title)
    }
    if (slug !== undefined) {
      updates.push(`slug = $${paramIndex++}`)
      values.push(slug)
    }
    if (excerpt !== undefined) {
      updates.push(`excerpt = $${paramIndex++}`)
      values.push(excerpt || null)
    }
    if (content !== undefined) {
      updates.push(`content = $${paramIndex++}`)
      values.push(content)
    }
    if (featuredImage !== undefined) {
      updates.push(`featured_image = $${paramIndex++}`)
      values.push(featuredImage || null)
    }
    if (categoryId !== undefined) {
      updates.push(`category_id = $${paramIndex++}`)
      values.push(categoryId || null)
    }
    if (tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`)
      values.push(tags)
    }
    if (isPublished !== undefined) {
      updates.push(`is_published = $${paramIndex++}`)
      values.push(isPublished)

      // Set published_at when first publishing
      if (isPublished && !wasPublished) {
        updates.push(`published_at = $${paramIndex++}`)
        values.push(new Date().toISOString())
      }
    }
    if (seoTitle !== undefined) {
      updates.push(`seo_title = $${paramIndex++}`)
      values.push(seoTitle || null)
    }
    if (seoDescription !== undefined) {
      updates.push(`seo_description = $${paramIndex++}`)
      values.push(seoDescription || null)
    }

    // Always update updated_by
    updates.push(`updated_by = $${paramIndex++}`)
    values.push(session.user.id)

    if (updates.length === 1) {
      // Only updated_by, no actual changes
      return apiSuccess({ message: 'Keine Änderungen' })
    }

    values.push(postId)

    await query(
      `UPDATE ${TABLE_NAMES.BLOG_POSTS}
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}`,
      values
    )

    logger.info('Blog post updated', { postId, userId: session.user.id })

    return apiSuccess({ message: 'Artikel aktualisiert' })
  } catch (error) {
    logger.error('Failed to update blog post', { postId, error })
    return apiError(error, 'Blog-Artikel konnte nicht aktualisiert werden')
  }
})

export const DELETE = withAdmin<{ id: string }>('content', async (request, session, context) => {
  const { id: postId } = context!.params!

  try {
    const result = await query(
      `DELETE FROM ${TABLE_NAMES.BLOG_POSTS} WHERE id = $1 RETURNING id`,
      [postId]
    )

    if (result.rows.length === 0) {
      return apiNotFound('Blog-Artikel')
    }

    logger.info('Blog post deleted', { postId, userId: session.user.id })

    return apiSuccess({ message: 'Artikel gelöscht' })
  } catch (error) {
    logger.error('Failed to delete blog post', { postId, error })
    return apiError(error, 'Blog-Artikel konnte nicht gelöscht werden')
  }
})
