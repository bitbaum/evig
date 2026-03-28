/**
 * API: Admin Blog Post by ID
 *
 * GET /api/admin/blog/[id] - Get single post
 * PATCH /api/admin/blog/[id] - Update post
 * DELETE /api/admin/blog/[id] - Delete post
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { blogPosts, blogCategories } from '@/db/schema'
import { eq, and, ne, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'

export const GET = withAdmin<{ id: string }>('content', async (request, session, context) => {
  const { id: postId } = context!.params!

  try {
    const [post] = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        featured_image: blogPosts.featuredImage,
        category_id: blogPosts.categoryId,
        category_name: blogCategories.name,
        tags: blogPosts.tags,
        is_published: blogPosts.isPublished,
        published_at: blogPosts.publishedAt,
        seo_title: blogPosts.seoTitle,
        seo_description: blogPosts.seoDescription,
        created_at: blogPosts.createdAt,
        updated_at: blogPosts.updatedAt,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(eq(blogPosts.id, postId))

    if (!post) {
      return apiNotFound('Blog-Artikel')
    }

    return apiSuccess(post)
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
    const [existing] = await db
      .select({ id: blogPosts.id, isPublished: blogPosts.isPublished, publishedAt: blogPosts.publishedAt })
      .from(blogPosts)
      .where(eq(blogPosts.id, postId))

    if (!existing) {
      return apiNotFound('Blog-Artikel')
    }

    const wasPublished = existing.isPublished

    // If slug is changed, check uniqueness
    if (slug) {
      const [slugConflict] = await db
        .select({ id: blogPosts.id })
        .from(blogPosts)
        .where(and(eq(blogPosts.slug, slug), ne(blogPosts.id, postId)))

      if (slugConflict) {
        return apiBadRequest('Ein Artikel mit diesem Slug existiert bereits')
      }
    }

    // Build update object
    const update: Record<string, unknown> = {}
    if (title !== undefined) update.title = title
    if (slug !== undefined) update.slug = slug
    if (excerpt !== undefined) update.excerpt = excerpt || null
    if (content !== undefined) update.content = content
    if (featuredImage !== undefined) update.featuredImage = featuredImage || null
    if (categoryId !== undefined) update.categoryId = categoryId || null
    if (tags !== undefined) update.tags = tags
    if (isPublished !== undefined) {
      update.isPublished = isPublished
      // Set published_at when publishing (first time or if missing)
      if (isPublished && (!wasPublished || !existing.publishedAt)) {
        update.publishedAt = new Date().toISOString()
      }
    }
    if (seoTitle !== undefined) update.seoTitle = seoTitle || null
    if (seoDescription !== undefined) update.seoDescription = seoDescription || null

    // Always update updated_by
    update.updatedBy = session.user.id
    update.updatedAt = sql`NOW()`

    // Check if there are actual field changes beyond updatedBy/updatedAt
    if (Object.keys(update).length <= 2) {
      return apiSuccess({ message: 'Keine Änderungen' })
    }

    await db.update(blogPosts).set(update).where(eq(blogPosts.id, postId))

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
    const [deleted] = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, postId))
      .returning({ id: blogPosts.id })

    if (!deleted) {
      return apiNotFound('Blog-Artikel')
    }

    logger.info('Blog post deleted', { postId, userId: session.user.id })

    return apiSuccess({ message: 'Artikel gelöscht' })
  } catch (error) {
    logger.error('Failed to delete blog post', { postId, error })
    return apiError(error, 'Blog-Artikel konnte nicht gelöscht werden')
  }
})
