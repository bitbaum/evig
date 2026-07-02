/**
 * GET  /api/admin/pages — list static pages
 * POST /api/admin/pages — create a static page
 *
 * The pages admin UI shipped calling these routes before they existed —
 * create always 404'd. Section-gated on 'content' like the sibling blog CRUD.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { staticPages } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { validateBody } from '@/lib/schemas'
import { StaticPageSchema } from '@/lib/schemas/static-pages'
import { logger } from '@/lib/logger'
import { sql } from 'drizzle-orm'

export const GET = withAdmin('content', async () => {
  try {
    const rows = await db
      .select({
        id: staticPages.id,
        slug: staticPages.slug,
        title: staticPages.title,
        is_published: staticPages.isPublished,
        published_at: staticPages.publishedAt,
        created_at: staticPages.createdAt,
        updated_at: staticPages.updatedAt,
      })
      .from(staticPages)
      .orderBy(desc(staticPages.updatedAt))
      .limit(200)

    return apiSuccess({ items: rows })
  } catch (error) {
    return apiError(error, 'Seiten konnten nicht geladen werden')
  }
})

export const POST = withAdmin('content', async (request: NextRequest, session) => {
  try {
    const body = await request.json()
    const validation = validateBody(StaticPageSchema, body)
    if (!validation.success) return validation.error
    const data = validation.data

    const [existing] = await db
      .select({ id: staticPages.id })
      .from(staticPages)
      .where(eq(staticPages.slug, data.slug))
      .limit(1)
    if (existing) {
      return apiBadRequest('Eine Seite mit diesem Slug existiert bereits')
    }

    const [created] = await db
      .insert(staticPages)
      .values({
        slug: data.slug,
        title: data.title,
        content: data.content,
        isPublished: data.is_published,
        publishedAt: data.is_published ? sql`NOW()` : null,
        metaTitle: data.seo_title || null,
        metaDescription: data.seo_description || null,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      })
      .returning({ id: staticPages.id })

    logger.info('Static page created', { pageId: created.id, slug: data.slug, userId: session.user.id })
    return apiSuccess({ id: created.id }, 201)
  } catch (error) {
    return apiError(error, 'Seite konnte nicht erstellt werden')
  }
})
