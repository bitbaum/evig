/**
 * API: Admin Blog Posts
 *
 * GET /api/admin/blog - List all posts
 * POST /api/admin/blog - Create new post
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiBadRequest } from '@/lib/api/helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'content')) {
      return apiForbidden('Kein Zugriff auf Inhalte')
    }

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
      created_at: string
      updated_at: string
    }>(
      `SELECT
        bp.id, bp.slug, bp.title, bp.excerpt, bp.content,
        bp.featured_image, bp.category_id,
        c.name as category_name,
        bp.tags, bp.is_published, bp.published_at,
        bp.created_at, bp.updated_at
      FROM ${TABLE_NAMES.BLOG_POSTS} bp
      LEFT JOIN ${TABLE_NAMES.BLOG_CATEGORIES} c ON bp.category_id = c.id
      ORDER BY bp.created_at DESC`
    )

    return apiSuccess(result.rows)
  } catch (error) {
    logger.error('Failed to list blog posts', { error })
    return apiError(error, 'Blog-Artikel konnten nicht geladen werden')
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'content')) {
      return apiForbidden('Kein Zugriff auf Inhalte')
    }

    const body = await request.json()
    const { title, slug, excerpt, content, featuredImage, categoryId, tags, isPublished } = body

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
    const existing = await query(
      `SELECT id FROM ${TABLE_NAMES.BLOG_POSTS} WHERE slug = $1`,
      [postSlug]
    )

    if (existing.rows.length > 0) {
      return apiBadRequest('Ein Artikel mit diesem Slug existiert bereits')
    }

    const result = await query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.BLOG_POSTS} (
        slug, title, excerpt, content, featured_image,
        category_id, tags, is_published, published_at,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
      RETURNING id`,
      [
        postSlug,
        title,
        excerpt || null,
        content,
        featuredImage || null,
        categoryId || null,
        tags || [],
        isPublished || false,
        isPublished ? new Date().toISOString() : null,
        session.user.id,
      ]
    )

    logger.info('Blog post created', { postId: result.rows[0].id, userId: session.user.id })

    return apiSuccess({ id: result.rows[0].id, slug: postSlug }, 201)
  } catch (error) {
    logger.error('Failed to create blog post', { error })
    return apiError(error, 'Blog-Artikel konnte nicht erstellt werden')
  }
}
