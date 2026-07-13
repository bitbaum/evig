/**
 * API: AI-translate a blog post into its missing (or specified) locales.
 *
 * POST /api/admin/blog/[id]/translate
 *   body: { locales?: string[], overwrite?: boolean }
 *
 * Scales "manage posts in every language without git": one action fills every
 * language tab from the German base via the provider cascade. The admin then
 * reviews each locale in the editor. Existing translations are preserved unless
 * `overwrite` is set or a locale is explicitly listed.
 */

import { db } from '@/db'
import { blogPosts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers'
import { locales, defaultLocale } from '@/i18n/routing'
import { translateBlogPost } from '@/lib/services/blog-translate'
import { syncPostTranslations, getPostTranslations } from '@/lib/services/blog-translations'

const TRANSLATABLE = locales.filter((l) => l !== defaultLocale)

export const POST = withAdmin<{ id: string }>('content', async (request, session, context) => {
  const { id: postId } = context!.params!

  try {
    const body = await request.json().catch(() => ({}))
    const overwrite = body?.overwrite === true
    const requested: string[] | undefined = Array.isArray(body?.locales) ? body.locales : undefined

    const [post] = await db
      .select({ title: blogPosts.title, excerpt: blogPosts.excerpt, content: blogPosts.content })
      .from(blogPosts)
      .where(eq(blogPosts.id, postId))

    if (!post) return apiNotFound('Blog-Artikel')

    const existing = await getPostTranslations(postId)
    const existingByLocale = new Map(existing.map((t) => [t.locale, t]))

    // Targets: explicit list (validated) or every translatable locale not yet present.
    const targets = (requested?.filter((l) => TRANSLATABLE.includes(l as (typeof TRANSLATABLE)[number])) ??
      TRANSLATABLE.filter((l) => !existingByLocale.has(l))
    ).filter((l) => overwrite || requested?.includes(l) || !existingByLocale.has(l))

    if (targets.length === 0) {
      return apiSuccess({ translated: [], failed: [], message: 'Alle Sprachen sind bereits übersetzt' })
    }

    // Translate one locale at a time. Firing them in parallel spikes the AI
    // provider's tokens-per-minute limit (that's how es/ja/ko/ru failed in the
    // first pass); each translateBlogPost already retries with backoff on a
    // transient throttle. A failure drops just that locale; the caller can
    // re-run to retry the ones still missing.
    const BATCH = 1
    const results: Array<{ locale: string; title?: string; excerpt?: string | null; content?: string; failed?: true }> = []
    for (let i = 0; i < targets.length; i += BATCH) {
      const batch = targets.slice(i, i + BATCH)
      const batchResults = await Promise.all(
        batch.map(async (locale) => {
          const t = await translateBlogPost(post, locale)
          return t ? { locale, ...t } : { locale, failed: true as const }
        }),
      )
      results.push(...batchResults)
    }

    const translated = results.filter(
      (r): r is { locale: string; title: string; excerpt: string | null; content: string } =>
        !r.failed && !!r.content,
    )
    const failed = results.filter((r) => r.failed).map((r) => r.locale)

    // Merge new translations over existing ones, then persist the full set.
    const merged = new Map(existingByLocale)
    for (const t of translated) {
      merged.set(t.locale, {
        locale: t.locale,
        title: t.title,
        excerpt: t.excerpt,
        content: t.content,
        seoTitle: existingByLocale.get(t.locale)?.seoTitle ?? null,
        seoDescription: existingByLocale.get(t.locale)?.seoDescription ?? null,
      })
    }

    const sync = await syncPostTranslations(postId, Array.from(merged.values()))
    if (!sync.success) return apiError(new Error(sync.error), sync.error || 'Speichern fehlgeschlagen')

    logger.info('Blog post translated', {
      postId,
      userId: session.user.id,
      translated: translated.map((t) => t.locale),
      failed,
    })

    return apiSuccess({
      translated: translated.map((t) => t.locale),
      failed,
      message:
        `${translated.length} Sprache(n) übersetzt` +
        (failed.length ? `, ${failed.length} fehlgeschlagen (${failed.join(', ')})` : ''),
    })
  } catch (error) {
    logger.error('Failed to translate blog post', { postId, error })
    return apiError(error, 'Übersetzung fehlgeschlagen')
  }
})
