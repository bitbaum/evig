/**
 * GET    /api/admin/pages/[id] — read a static page for editing
 * PUT    /api/admin/pages/[id] — update a static page
 * DELETE /api/admin/pages/[id] — delete a static page
 *
 * The edit UI shipped calling these routes before they existed — every edit
 * rendered "Seite nicht gefunden". Section-gated on 'content'.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { staticPages } from '@/db/schema'
import { and, eq, ne, sql } from 'drizzle-orm'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { validateBody } from '@/lib/schemas'
import { StaticPageSchema } from '@/lib/schemas/static-pages'
import { logger } from '@/lib/logger'

export const GET = withAdmin<{ id: string }>('content', async (_request, _session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiNotFound('Seite')

    const [row] = await db
      .select({
        id: staticPages.id,
        slug: staticPages.slug,
        title: staticPages.title,
        content: staticPages.content,
        is_published: staticPages.isPublished,
        seo_title: staticPages.metaTitle,
        seo_description: staticPages.metaDescription,
      })
      .from(staticPages)
      .where(eq(staticPages.id, id))
      .limit(1)

    if (!row) return apiNotFound('Seite')
    return apiSuccess(row)
  } catch (error) {
    return apiError(error, 'Seite konnte nicht geladen werden')
  }
})

export const PUT = withAdmin<{ id: string }>('content', async (request: NextRequest, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiNotFound('Seite')

    const body = await request.json()
    const validation = validateBody(StaticPageSchema, body)
    if (!validation.success) return validation.error
    const data = validation.data

    const [existing] = await db
      .select({ id: staticPages.id, isPublished: staticPages.isPublished })
      .from(staticPages)
      .where(eq(staticPages.id, id))
      .limit(1)
    if (!existing) return apiNotFound('Seite')

    const [slugClash] = await db
      .select({ id: staticPages.id })
      .from(staticPages)
      .where(and(eq(staticPages.slug, data.slug), ne(staticPages.id, id)))
      .limit(1)
    if (slugClash) {
      return apiBadRequest('Eine andere Seite verwendet diesen Slug bereits')
    }

    await db
      .update(staticPages)
      .set({
        slug: data.slug,
        title: data.title,
        content: data.content,
        isPublished: data.is_published,
        // Stamp publishedAt on the draft→published transition only.
        ...(data.is_published && !existing.isPublished ? { publishedAt: sql`NOW()` } : {}),
        metaTitle: data.seo_title || null,
        metaDescription: data.seo_description || null,
        updatedAt: sql`NOW()`,
        updatedBy: session.user.id,
      })
      .where(eq(staticPages.id, id))

    logger.info('Static page updated', { pageId: id, userId: session.user.id })
    return apiSuccess({ id })
  } catch (error) {
    return apiError(error, 'Seite konnte nicht gespeichert werden')
  }
})

export const DELETE = withAdmin<{ id: string }>('content', async (_request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiNotFound('Seite')

    const [existing] = await db
      .select({ id: staticPages.id })
      .from(staticPages)
      .where(eq(staticPages.id, id))
      .limit(1)
    if (!existing) return apiNotFound('Seite')

    await db.delete(staticPages).where(eq(staticPages.id, id))

    logger.info('Static page deleted', { pageId: id, userId: session.user.id })
    return apiSuccess({ id })
  } catch (error) {
    return apiError(error, 'Seite konnte nicht gelöscht werden')
  }
})
