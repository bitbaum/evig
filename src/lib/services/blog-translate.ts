/**
 * AI-assisted blog translation
 *
 * Scalable path to "a post in all 8 languages without git": given the German
 * base of a DB post, machine-translate it into any target locale using the
 * configured provider cascade (Groq → OpenRouter → Ollama, the same SSOT the
 * rest of the app uses). The admin then reviews each locale in the editor tabs.
 *
 * Design notes:
 * - Content is translated as RAW Markdown (not wrapped in JSON) so a 2000-word
 *   body with an embedded table can't corrupt JSON escaping. Title + excerpt are
 *   short, so they go through one small JSON call.
 * - Brand/protocol names and URLs are kept verbatim via the system prompt.
 */

import { callWithFallback, extractJson } from '@/lib/ai/providers'
import { locales, localeLabels, defaultLocale, type Locale } from '@/i18n/routing'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { blogPosts } from '@/db/schema/content'
import { eq } from 'drizzle-orm'
import { syncPostTranslations, getPostTranslations } from '@/lib/services/blog-translations'

const TRANSLATABLE_LOCALES = locales.filter((l) => l !== defaultLocale)

export interface BlogTranslationSource {
  title: string
  excerpt?: string | null
  content: string
}

export interface TranslatedFields {
  title: string
  excerpt: string | null
  content: string
}

const KEEP_VERBATIM =
  'RevampIT, Mastodon, Bluesky, Nostr, Lemmy, Matrix, Element, Signal, Telegram, ' +
  'X, Twitter, Threads, TikTok, Meta, ActivityPub, AT Protocol, MTProto, PDS, DID, ' +
  'AppView, Relay, Fediverse, xAI, Grok'

function languageName(locale: string): string {
  return localeLabels[locale as Locale] || locale
}

/**
 * Retry a provider call that returned null (all providers failed — often a
 * transient tokens-per-minute throttle after several large translations).
 * Backoff 2s → 6s gives the per-minute budget a chance to recover without
 * stalling the request for a full minute.
 */
// No real backoff under test (keeps the suite fast); real delay in prod.
const RETRY_BASE_MS = process.env.JEST_WORKER_ID ? 0 : 2000
async function withRetry<T>(fn: () => Promise<T | null>, attempts = 3): Promise<T | null> {
  for (let i = 0; i < attempts; i++) {
    const result = await fn()
    if (result) return result
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, RETRY_BASE_MS * (i + 1)))
  }
  return null
}

/** Translate the long Markdown body. Returns raw translated Markdown. */
async function translateContent(content: string, target: string): Promise<string | null> {
  const lang = languageName(target)
  const result = await callWithFallback({
    systemPrompt:
      `You are a professional translator. Translate the following Markdown blog post from German into ${lang}. ` +
      `Preserve ALL Markdown structure EXACTLY: headings (#), tables (| … | with their separator row), ` +
      `blockquotes (>), lists, bold/italic, and links. Translate human-readable text inside tables too, but keep ` +
      `the table columns and pipes intact. Do NOT translate URLs, code, or these names: ${KEEP_VERBATIM}. ` +
      `Keep the tone: accessible for a general reader, with technical depth in the blockquoted sections. ` +
      `Output ONLY the translated Markdown — no preamble, no explanation, no surrounding code fences.`,
    userPrompt: content,
    temperature: 0.2,
    maxTokens: 8192,
  })
  if (!result?.text) return null
  // Strip an accidental ```-fence wrapper if the model added one.
  return result.text.trim().replace(/^```(?:markdown)?\n([\s\S]*)\n```$/m, '$1').trim()
}

/** Translate title + optional excerpt via one small JSON call. */
async function translateMeta(
  title: string,
  excerpt: string | null | undefined,
  target: string,
): Promise<{ title: string; excerpt: string | null } | null> {
  const lang = languageName(target)
  const result = await callWithFallback({
    systemPrompt:
      `Translate the given blog fields from German into ${lang}. Keep these names verbatim: ${KEEP_VERBATIM}. ` +
      `Return ONLY a JSON object of the form {"title": "...", "excerpt": "..."} with no other text.`,
    userPrompt: JSON.stringify({ title, excerpt: excerpt || '' }),
    temperature: 0.2,
    maxTokens: 1024,
  })
  if (!result?.text) return null
  const parsed = extractJson(result.text, /\{[\s\S]*\}/) as { title?: string; excerpt?: string } | null
  if (!parsed?.title) return null
  return { title: parsed.title, excerpt: parsed.excerpt?.trim() || null }
}

/**
 * Translate a post's base into one target locale. Returns null if the AI call
 * fails so the caller can report which locales didn't translate.
 */
export async function translateBlogPost(
  source: BlogTranslationSource,
  targetLocale: string,
): Promise<TranslatedFields | null> {
  if (targetLocale === defaultLocale) return null // base is already German
  try {
    // Sequential (not parallel) so two large calls don't spike the per-minute
    // token budget at once; each retries on a transient throttle.
    const content = await withRetry(() => translateContent(source.content, targetLocale))
    if (!content) return null
    const meta = await withRetry(() => translateMeta(source.title, source.excerpt, targetLocale))
    if (!meta) return null
    return { title: meta.title, excerpt: meta.excerpt, content }
  } catch (error) {
    logger.error('Blog translation failed', { targetLocale, error })
    return null
  }
}

export interface FillTranslationsResult {
  translated: string[]
  failed: string[]
  notFound?: boolean
}

/**
 * Fill a post's missing locales from its German base and persist them (flagged
 * machine-made). Shared by the manual endpoint and the auto-on-publish trigger.
 * Missing-only by default — a human (or already-machine) translation is never
 * overwritten unless `overwrite` is set or the locale is explicitly requested.
 * Sequential to respect the provider's per-minute token limit.
 */
export async function fillMissingTranslations(
  postId: string,
  opts: { overwrite?: boolean; locales?: string[] } = {},
): Promise<FillTranslationsResult> {
  const { overwrite = false, locales: requested } = opts

  const [post] = await db
    .select({ title: blogPosts.title, excerpt: blogPosts.excerpt, content: blogPosts.content })
    .from(blogPosts)
    .where(eq(blogPosts.id, postId))
  if (!post) return { translated: [], failed: [], notFound: true }

  const existing = await getPostTranslations(postId)
  const existingByLocale = new Map(existing.map((t) => [t.locale, t]))

  const inScope = (l: string) => TRANSLATABLE_LOCALES.includes(l as (typeof TRANSLATABLE_LOCALES)[number])
  const targets = (requested?.filter(inScope) ?? TRANSLATABLE_LOCALES.filter((l) => !existingByLocale.has(l))).filter(
    (l) => overwrite || requested?.includes(l) || !existingByLocale.has(l),
  )
  if (targets.length === 0) return { translated: [], failed: [] }

  const translated: Array<{ locale: string; title: string; excerpt: string | null; content: string }> = []
  const failed: string[] = []
  for (const locale of targets) {
    const t = await translateBlogPost(post, locale)
    if (t) translated.push({ locale, ...t })
    else failed.push(locale)
  }

  const merged = new Map(existingByLocale)
  for (const t of translated) {
    merged.set(t.locale, {
      locale: t.locale,
      title: t.title,
      excerpt: t.excerpt,
      content: t.content,
      seoTitle: existingByLocale.get(t.locale)?.seoTitle ?? null,
      seoDescription: existingByLocale.get(t.locale)?.seoDescription ?? null,
      isMachine: true,
    })
  }
  await syncPostTranslations(postId, Array.from(merged.values()))

  return { translated: translated.map((t) => t.locale), failed }
}
