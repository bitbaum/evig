/**
 * API: Single Blog Category
 *
 * GET /api/admin/blog/categories/[id] - Get category details
 * PATCH /api/admin/blog/categories/[id] - Update category
 * DELETE /api/admin/blog/categories/[id] - Delete category
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { blogCategories, blogPosts } from '@/db/schema'
import { eq, and, ne, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiBadRequest,
} from '@/lib/api/helpers'

export const GET = withAdmin<{ id: string }>('content', async (request, session, context) => {
  try {
    const { id } = context!.params!

    const [category] = await db
      .select({
        id: blogCategories.id,
        slug: blogCategories.slug,
        name: blogCategories.name,
        description: blogCategories.description,
        color: blogCategories.color,
        sort_order: blogCategories.sortOrder,
      })
      .from(blogCategories)
      .where(eq(blogCategories.id, id))

    if (!category) {
      return apiNotFound('Kategorie')
    }

    return apiSuccess(category)
  } catch (error) {
    logger.error('Failed to get blog category', { error })
    return apiError(error, 'Kategorie konnte nicht geladen werden')
  }
})

export const PATCH = withAdmin<{ id: string }>('content', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()
    const { name, slug, description, color, sort_order } = body

    // Check if category exists
    const [existing] = await db
      .select({ id: blogCategories.id })
      .from(blogCategories)
      .where(eq(blogCategories.id, id))

    if (!existing) {
      return apiNotFound('Kategorie')
    }

    if (!name || !slug) {
      return apiBadRequest('Name und Slug sind erforderlich')
    }

    // Check if slug is unique (excluding current category)
    const [slugConflict] = await db
      .select({ id: blogCategories.id })
      .from(blogCategories)
      .where(and(eq(blogCategories.slug, slug), ne(blogCategories.id, id)))

    if (slugConflict) {
      return apiBadRequest('Eine andere Kategorie mit diesem Slug existiert bereits')
    }

    const [updated] = await db
      .update(blogCategories)
      .set({
        name,
        slug,
        description: description || null,
        color: color || null,
        sortOrder: sort_order || 0,
        updatedAt: sql`NOW()`,
      })
      .where(eq(blogCategories.id, id))
      .returning({
        id: blogCategories.id,
        name: blogCategories.name,
        slug: blogCategories.slug,
        description: blogCategories.description,
        color: blogCategories.color,
        sort_order: blogCategories.sortOrder,
      })

    logger.info('Blog category updated', {
      userId: session.user.id,
      categoryId: id,
      slug,
    })

    return apiSuccess(updated)
  } catch (error) {
    logger.error('Failed to update blog category', { error })
    return apiError(error, 'Kategorie konnte nicht aktualisiert werden')
  }
})

export const DELETE = withAdmin<{ id: string }>('content', async (request, session, context) => {
  try {
    const { id } = context!.params!

    // Check if category exists
    const [existing] = await db
      .select({ id: blogCategories.id, name: blogCategories.name })
      .from(blogCategories)
      .where(eq(blogCategories.id, id))

    if (!existing) {
      return apiNotFound('Kategorie')
    }

    // Check if category has posts
    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogPosts)
      .where(eq(blogPosts.categoryId, id))

    const postCount = Number(countRow?.count ?? 0)
    if (postCount > 0) {
      return apiBadRequest(
        `Kategorie kann nicht gelöscht werden - ${postCount} Artikel zugewiesen`
      )
    }

    await db.delete(blogCategories).where(eq(blogCategories.id, id))

    logger.info('Blog category deleted', {
      userId: session.user.id,
      categoryId: id,
      categoryName: existing.name,
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    logger.error('Failed to delete blog category', { error })
    return apiError(error, 'Kategorie konnte nicht gelöscht werden')
  }
})
