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
import { localeLabels, defaultLocale, type Locale } from '@/i18n/routing'
import { logger } from '@/lib/logger'

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
async function withRetry<T>(fn: () => Promise<T | null>, attempts = 3): Promise<T | null> {
  for (let i = 0; i < attempts; i++) {
    const result = await fn()
    if (result) return result
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 2000 * (i + 1)))
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
