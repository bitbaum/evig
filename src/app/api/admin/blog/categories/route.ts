/**
 * API: Blog Categories
 *
 * GET /api/admin/blog/categories - List categories for dropdown
 * POST /api/admin/blog/categories - Create new category
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { blogCategories } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiBadRequest,
} from '@/lib/api/helpers'

export const GET = withAdmin('content', async (request, session) => {
  try {
    const rows = await db
      .select({
        id: blogCategories.id,
        slug: blogCategories.slug,
        name: blogCategories.name,
        description: blogCategories.description,
        color: blogCategories.color,
      })
      .from(blogCategories)
      .orderBy(asc(blogCategories.sortOrder), asc(blogCategories.name))

    return apiSuccess(rows)
  } catch (error) {
    logger.error('Failed to list blog categories', { error })
    return apiError(error, 'Kategorien konnten nicht geladen werden')
  }
})

export const POST = withAdmin('content', async (request, session) => {
  try {
    const body = await request.json()
    const { name, slug, description, color, sort_order } = body

    if (!name || !slug) {
      return apiBadRequest('Name und Slug sind erforderlich')
    }

    // Check if slug already exists
    const [existing] = await db
      .select({ id: blogCategories.id })
      .from(blogCategories)
      .where(eq(blogCategories.slug, slug))

    if (existing) {
      return apiBadRequest('Eine Kategorie mit diesem Slug existiert bereits')
    }

    const [created] = await db
      .insert(blogCategories)
      .values({
        name,
        slug,
        description: description || null,
        color: color || null,
        sortOrder: sort_order || 0,
      })
      .returning({
        id: blogCategories.id,
        name: blogCategories.name,
        slug: blogCategories.slug,
        description: blogCategories.description,
        color: blogCategories.color,
        sort_order: blogCategories.sortOrder,
      })

    logger.info('Blog category created', {
      userId: session.user.id,
      categoryId: created.id,
      slug,
    })

    return apiSuccess(created, 201)
  } catch (error) {
    logger.error('Failed to create blog category', { error })
    return apiError(error, 'Kategorie konnte nicht erstellt werden')
  }
})
