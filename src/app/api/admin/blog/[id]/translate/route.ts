/**
 * API: AI-translate a blog post into its missing (or specified) locales.
 *
 * POST /api/admin/blog/[id]/translate
 *   body: { locales?: string[], overwrite?: boolean }
 *
 * Scales "manage posts in every language without git": one action fills every
 * language tab from the German base via the provider cascade. The admin then
 * reviews each locale in the editor. Existing translations are preserved unless
 * `overwrite` is set or a locale is explicitly listed. Same engine as the
 * auto-on-publish trigger (fillMissingTranslations).
 */

import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers'
import { fillMissingTranslations } from '@/lib/services/blog-translate'

export const POST = withAdmin<{ id: string }>('content', async (request, session, context) => {
  const { id: postId } = context!.params!

  try {
    const body = await request.json().catch(() => ({}))
    const overwrite = body?.overwrite === true
    const requested: string[] | undefined = Array.isArray(body?.locales) ? body.locales : undefined

    const result = await fillMissingTranslations(postId, { overwrite, locales: requested })
    if (result.notFound) return apiNotFound('Blog-Artikel')

    logger.info('Blog post translated', {
      postId,
      userId: session.user.id,
      translated: result.translated,
      failed: result.failed,
    })

    return apiSuccess({
      translated: result.translated,
      failed: result.failed,
      message:
        result.translated.length === 0 && result.failed.length === 0
          ? 'Alle Sprachen sind bereits übersetzt'
          : `${result.translated.length} Sprache(n) übersetzt` +
            (result.failed.length ? `, ${result.failed.length} fehlgeschlagen (${result.failed.join(', ')})` : ''),
    })
  } catch (error) {
    logger.error('Failed to translate blog post', { postId, error })
    return apiError(error, 'Übersetzung fehlgeschlagen')
  }
})
