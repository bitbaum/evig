/**
 * API: Public Blog Categories
 *
 * GET /api/blog/categories - List active categories for public use
 */

import { db } from '@/db'
import { blogCategories } from '@/db/schema'
import { asc } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError } from '@/lib/api/helpers'

export async function GET() {
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
    logger.error('Failed to fetch public blog categories', { error })
    return apiError(error, 'Kategorien konnten nicht geladen werden')
  }
}
