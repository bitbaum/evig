import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { locales } from '@/i18n/routing'
import { parseBlogAudience, type BlogAudience } from '@/config/blog'

// js-yaml@4 ships no bundled type declarations and @types/js-yaml is not a
// project dependency, so import it with the minimal typed surface we consume.
const { load: loadYaml } = require('js-yaml') as { load: (str: string) => unknown }

const postsDirectory = path.join(process.cwd(), 'content/posts')

// gray-matter@4 is pinned to js-yaml@3 (which had yaml.safeLoad), but this repo
// hoists js-yaml@4 where safeLoad was removed and now throws. Supply our own
// YAML engine backed by js-yaml@4's `load` so frontmatter parsing works against
// the installed yaml instead of crashing on every post.
const matterOptions = {
  engines: {
    yaml: (str: string) => (loadYaml(str) ?? {}) as Record<string, unknown>,
  },
}

// Canonical language. Bare `<slug>.md` files (and any post lacking a
// translation) resolve to German, mirroring the site-wide DE fallback.
const DEFAULT_LOCALE = 'de'
const LOCALE_SET = new Set<string>(locales)

export interface BlogPost {
  slug: string
  title: string
  excerpt?: string
  featuredImage?: string
  author: string
  category?: string
  tags?: string[]
  publishedAt?: string
  published?: boolean
  body: string
  createdAt: string
  locale?: string
  /**
   * Optional SEO overrides (DB posts only). When present they drive the
   * `<title>`/meta description instead of the display title/excerpt. File posts
   * leave these undefined and fall back to title/excerpt.
   */
  seoTitle?: string
  seoDescription?: string
  /**
   * True when the *displayed* locale is a machine translation (DB posts only).
   * Drives the public "automatisch übersetzt" note. Undefined = human/base.
   */
  isMachine?: boolean
  /**
   * `public` (default) is listed on the blog and visible to everyone.
   * `unlisted` is hidden from the public listing but its direct link works for
   * `link` is viewable by anyone with the link (no account, no password) but
   * kept out of the listing/index — the normal "share a link" case. `unlisted`
   * is the same but behind a shared password (sensitive ops content, e.g. the
   * ops runbook). Both stay out of the public listing and the search index.
   */
  visibility: 'public' | 'unlisted' | 'link'
  /**
   * Access-control axis (orthogonal to `visibility`): who may load the post.
   * `public` (default) = anyone · `team` = logged-in staff · `author` = the
   * author (`authorId`) + super admins. File posts carry no `authorId`, so an
   * `author`-audience file post is reachable by super admins only.
   */
  audience: BlogAudience
  /** DB author (blog_posts.created_by). Undefined for file posts. */
  authorId?: string
}

// Frontmatter `visibility:`. `link` → shareable, no password. The "not public"
// spellings (`unlisted`/`staff`/`internal`) → password-gated. Else → public.
function parseVisibility(value: unknown): BlogPost['visibility'] {
  if (value === 'link') return 'link'
  if (value === 'unlisted' || value === 'staff' || value === 'internal') return 'unlisted'
  return 'public'
}

/** Only genuinely public posts appear in the listing; link-only ones don't. */
export function isListedPost(post: BlogPost): boolean {
  return post.visibility === 'public'
}

// Filenames encode locale as a suffix: `tablets.md` (→ de), `tablets.en.md`,
// `tablets.fr.md`. A trailing segment is treated as a locale only when it is a
// known locale code, so slugs that happen to contain dots stay intact.
function parseFileName(fileName: string): { slug: string; locale: string } {
  const base = fileName.replace(/\.md$/, '')
  const dot = base.lastIndexOf('.')
  if (dot > 0) {
    const maybeLocale = base.slice(dot + 1)
    if (LOCALE_SET.has(maybeLocale)) {
      return { slug: base.slice(0, dot), locale: maybeLocale }
    }
  }
  return { slug: base, locale: DEFAULT_LOCALE }
}

function readPost(fileName: string, slug: string, locale: string): BlogPost {
  const fullPath = path.join(postsDirectory, fileName)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents, matterOptions)
  const stats = fs.statSync(fullPath)

  return {
    slug,
    title: data.title || 'Untitled',
    excerpt: data.excerpt,
    featuredImage: data.featuredImage,
    author: data.author || 'RevampIt Team',
    category: data.category,
    tags: data.tags || [],
    publishedAt: data.publishedAt,
    published: data.published !== false, // default to true if not specified
    body: content,
    createdAt: stats.birthtime.toISOString(),
    locale,
    visibility: parseVisibility(data.visibility),
    audience: parseBlogAudience(data.audience),
  }
}

/**
 * All published posts for a locale. Each slug resolves to its translation for
 * `locale` when present, otherwise the German original (DE-canonical fallback),
 * so partially-translated content still surfaces on every locale.
 */
export function getAllPosts(locale: string = DEFAULT_LOCALE): BlogPost[] {
  if (!fs.existsSync(postsDirectory)) {
    return []
  }

  // slug → { locale → fileName }
  const bySlug = new Map<string, Map<string, string>>()
  for (const fileName of fs.readdirSync(postsDirectory)) {
    if (!fileName.endsWith('.md')) continue
    const { slug, locale: fileLocale } = parseFileName(fileName)
    if (!bySlug.has(slug)) bySlug.set(slug, new Map())
    bySlug.get(slug)!.set(fileLocale, fileName)
  }

  const posts: BlogPost[] = []
  for (const [slug, byLocale] of bySlug) {
    const chosenLocale = byLocale.has(locale) ? locale : DEFAULT_LOCALE
    const fileName = byLocale.get(chosenLocale)
    if (!fileName) continue // no translation and no German original
    posts.push(readPost(fileName, slug, chosenLocale))
  }

  return posts
    .filter((post) => post.published)
    .sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(a.createdAt)
      const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(b.createdAt)
      return dateB.getTime() - dateA.getTime()
    })
}

/**
 * Locales that have a translation file for this slug (the DE original counts).
 * Drives hreflang alternates so search engines see every translated variant.
 */
export function getPostLocales(slug: string): string[] {
  if (!fs.existsSync(postsDirectory)) return []
  const found = new Set<string>()
  for (const fileName of fs.readdirSync(postsDirectory)) {
    if (!fileName.endsWith('.md')) continue
    const parsed = parseFileName(fileName)
    if (parsed.slug === slug) found.add(parsed.locale)
  }
  return [...found]
}

/**
 * A single post by slug, preferring the requested locale and falling back to
 * the German original.
 */
export function getPostBySlug(slug: string, locale: string = DEFAULT_LOCALE): BlogPost | null {
  const candidates = [`${slug}.${locale}.md`, `${slug}.md`, `${slug}.${DEFAULT_LOCALE}.md`]
  for (const fileName of candidates) {
    const fullPath = path.join(postsDirectory, fileName)
    if (fs.existsSync(fullPath)) {
      const { locale: fileLocale } = parseFileName(fileName)
      return readPost(fileName, slug, fileLocale)
    }
  }
  return null
}
