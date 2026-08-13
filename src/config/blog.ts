/**
 * Blog config (SSOT).
 */

/** Posts per page in the index "latest" section (hero + featured are extra on page 1). */
export const BLOG_PAGE_SIZE = 12

/** Posts per page in the admin blog list. */
export const ADMIN_BLOG_PAGE_SIZE = 50

/**
 * Category KEYS (frontmatter/DB names slugified via `slugifyCategory`) that
 * have per-locale labels in `messages/<locale>.json` under
 * `blog.categoryLabels`. Structure lives here (i18n SSOT rule: keys in config,
 * strings in messages); categories without a key render their raw name.
 */
export const BLOG_CATEGORY_KEYS = [
  'betrieb',
  'engineering',
  'menschen',
  'nachhaltigkeit',
  'produkt',
  'sustainability',
  'technik',
] as const
export type BlogCategoryKey = (typeof BLOG_CATEGORY_KEYS)[number]

/**
 * Retired post slugs that may still be linked externally → permanent redirect
 * instead of a 404. Key = old slug, value = locale-aware href (resolved via
 * `permanentRedirect` from `@/i18n/navigation`).
 */
export const RETIRED_POST_REDIRECTS: Record<string, string> = {
  // Retired 2026-08 (commit 9159b4ff1) — superseded by `gebaut-nicht-gewollt`.
  'die-revamp-it-plattform': '/blog',
}

// AUDIENCE — access-control axis. The SSOT lives in `@/config/content-audience`
// (shared with presentation decks). Re-exported here under the blog-specific
// names existing call sites already import.
export {
  CONTENT_AUDIENCE as BLOG_AUDIENCE,
  CONTENT_AUDIENCE_VALUES as BLOG_AUDIENCE_VALUES,
  CONTENT_AUDIENCE_LABELS as BLOG_AUDIENCE_LABELS,
  parseContentAudience as parseBlogAudience,
} from './content-audience'
export type { ContentAudience as BlogAudience } from './content-audience'
