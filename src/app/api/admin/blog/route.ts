/**
 * API: Admin Blog Posts
 *
 * GET /api/admin/blog - List all posts
 * POST /api/admin/blog - Create new post
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { blogPosts, blogCategories } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { syncPostTranslations } from '@/lib/services/blog-translations'

export const GET = withAdmin('content', async (request, session) => {
  try {
    const posts = await db
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
        created_at: blogPosts.createdAt,
        updated_at: blogPosts.updatedAt,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .orderBy(desc(blogPosts.createdAt))

    return apiSuccess(posts)
  } catch (error) {
    logger.error('Failed to list blog posts', { error })
    return apiError(error, 'Blog-Artikel konnten nicht geladen werden')
  }
})

export const POST = withAdmin('content', async (request, session) => {
  try {
    const body = await request.json()
    const { title, slug, excerpt, content, featuredImage, categoryId, tags, isPublished, translations } = body

    if (!title || !content) {
      return apiBadRequest('Titel und Inhalt sind erforderlich')
    }

    // Generate slug if not provided
    const postSlug = slug || title
      .toLowerCase()
      .replace(/[äöüÄÖÜ]/g, (match: string) => {
        const map: Record<string, string> = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'Ä': 'ae', 'Ö': 'oe', 'Ü': 'ue' }
        return map[match] || match
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check slug uniqueness
    const [existing] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, postSlug))

    if (existing) {
      return apiBadRequest('Ein Artikel mit diesem Slug existiert bereits')
    }

    const [post] = await db
      .insert(blogPosts)
      .values({
        slug: postSlug,
        title,
        excerpt: excerpt || null,
        content,
        featuredImage: featuredImage || null,
        categoryId: categoryId || null,
        tags: tags || [],
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date().toISOString() : null,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      })
      .returning({ id: blogPosts.id })

    if (translations !== undefined) {
      const result = await syncPostTranslations(post.id, translations)
      if (!result.success) return apiBadRequest(result.error!)
    }

    logger.info('Blog post created', { postId: post.id, userId: session.user.id })

    return apiSuccess({ id: post.id, slug: postSlug }, 201)
  } catch (error) {
    logger.error('Failed to create blog post', { error })
    return apiError(error, 'Blog-Artikel konnte nicht erstellt werden')
  }
})
