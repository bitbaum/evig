/**
 * Blog post translation sync
 *
 * One place to write the per-locale overlay rows for a DB post. Given the full
 * desired set of translations, it upserts each and removes any locale no longer
 * present — so the admin editor's language tabs are the single source of truth
 * for which locales a post exists in.
 */

import { db } from '@/db'
import { blogPostTranslations } from '@/db/schema/content'
import { eq, and, notInArray } from 'drizzle-orm'
import { BlogTranslationsSchema, type BlogTranslationInput } from '@/lib/schemas/blog'
import { logger } from '@/lib/logger'

export interface SyncTranslationsResult {
  success: boolean
  error?: string
  count?: number
}

/**
 * Replace a post's translation rows with `translations` (validated). Locales
 * absent from the array are deleted. Idempotent. Returns a structured result
 * instead of throwing so callers can surface a 400 on invalid input.
 */
export async function syncPostTranslations(
  postId: string,
  translations: unknown,
): Promise<SyncTranslationsResult> {
  const parsed = BlogTranslationsSchema.safeParse(translations ?? [])
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Ungültige Übersetzungen' }
  }
  const rows: BlogTranslationInput[] = parsed.data
  const keepLocales = rows.map((r) => r.locale)

  try {
    await db.transaction(async (tx) => {
      // Drop locales the admin removed.
      if (keepLocales.length > 0) {
        await tx
          .delete(blogPostTranslations)
          .where(
            and(eq(blogPostTranslations.postId, postId), notInArray(blogPostTranslations.locale, keepLocales)),
          )
      } else {
        await tx.delete(blogPostTranslations).where(eq(blogPostTranslations.postId, postId))
      }

      for (const t of rows) {
        const isMachine = t.isMachine === true
        await tx
          .insert(blogPostTranslations)
          .values({
            postId,
            locale: t.locale,
            title: t.title,
            excerpt: t.excerpt || null,
            content: t.content,
            seoTitle: t.seoTitle || null,
            seoDescription: t.seoDescription || null,
            isMachine,
          })
          .onConflictDoUpdate({
            target: [blogPostTranslations.postId, blogPostTranslations.locale],
            set: {
              title: t.title,
              excerpt: t.excerpt || null,
              content: t.content,
              seoTitle: t.seoTitle || null,
              seoDescription: t.seoDescription || null,
              isMachine,
              updatedAt: new Date().toISOString(),
            },
          })
      }
    })
    return { success: true, count: rows.length }
  } catch (error) {
    logger.error('Failed to sync blog post translations', { postId, error })
    return { success: false, error: 'Übersetzungen konnten nicht gespeichert werden' }
  }
}

/** Read a post's translation rows for the admin editor (all locales). */
export async function getPostTranslations(postId: string): Promise<BlogTranslationInput[]> {
  try {
    const rows = await db
      .select({
        locale: blogPostTranslations.locale,
        title: blogPostTranslations.title,
        excerpt: blogPostTranslations.excerpt,
        content: blogPostTranslations.content,
        seoTitle: blogPostTranslations.seoTitle,
        seoDescription: blogPostTranslations.seoDescription,
        isMachine: blogPostTranslations.isMachine,
      })
      .from(blogPostTranslations)
      .where(eq(blogPostTranslations.postId, postId))
    return rows.map((r) => ({
      locale: r.locale,
      title: r.title,
      excerpt: r.excerpt,
      content: r.content,
      seoTitle: r.seoTitle,
      seoDescription: r.seoDescription,
      isMachine: r.isMachine,
    }))
  } catch (error) {
    logger.error('Failed to read blog post translations', { postId, error })
    return []
  }
}
