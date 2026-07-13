/**
 * Blog Database Functions
 *
 * Reads blog posts from the database for public display.
 * Admin writes to database, public reads from database.
 * SSOT: Database is the single source of truth for blog content.
 *
 * Interface matches src/lib/blog.ts for backward compatibility with components.
 *
 * i18n: blog_posts holds the canonical German text; blog_post_translations
 * overlays per-locale title/excerpt/content/seo for non-German locales. A read
 * for locale X overlays the matching translation row and falls back to the
 * German base when none exists (mirrors the site-wide DE fallback).
 */

import { db } from '@/db'
import { blogPosts, blogCategories, blogHiddenSlugs, blogPostTranslations } from '@/db/schema/content'
import { users } from '@/db/schema/auth'
import { eq, and, lte, desc, asc } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import type { BlogPost } from '@/lib/blog'
import { defaultLocale } from '@/i18n/routing'

export type { BlogPost }

export interface BlogCategory {
  id: string
  slug: string
  name: string
  description: string | null
  color: string | null
  isActive: boolean
}

/** Columns shared by every public post query (base + translation overlay). */
const postColumns = {
  slug: blogPosts.slug,
  title: blogPosts.title,
  excerpt: blogPosts.excerpt,
  content: blogPosts.content,
  seoTitle: blogPosts.seoTitle,
  seoDescription: blogPosts.seoDescription,
  featuredImage: blogPosts.featuredImage,
  authorName: users.name,
  categoryName: blogCategories.name,
  tags: blogPosts.tags,
  visibility: blogPosts.visibility,
  publishedAt: blogPosts.publishedAt,
  createdAt: blogPosts.createdAt,
  // Translation overlay — null unless a row exists for the joined locale.
  tTitle: blogPostTranslations.title,
  tExcerpt: blogPostTranslations.excerpt,
  tContent: blogPostTranslations.content,
  tSeoTitle: blogPostTranslations.seoTitle,
  tSeoDescription: blogPostTranslations.seoDescription,
  tIsMachine: blogPostTranslations.isMachine,
}

/**
 * Locale to overlay. For the default locale (or none) we join on the default
 * locale itself: no translation row is ever stored for `defaultLocale` (the
 * write boundary rejects it), so the join simply matches nothing and every
 * overlay column stays null → the German base is used.
 */
function overlayLocale(locale?: string): string {
  return locale && locale !== defaultLocale ? locale : defaultLocale
}

/**
 * Get all published blog posts (optionally overlaid with a locale translation).
 */
export async function getAllPosts(locale?: string): Promise<BlogPost[]> {
  try {
    const rows = await db
      .select(postColumns)
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(users, eq(blogPosts.createdBy, users.id))
      .leftJoin(
        blogPostTranslations,
        and(
          eq(blogPostTranslations.postId, blogPosts.id),
          eq(blogPostTranslations.locale, overlayLocale(locale)),
        ),
      )
      .where(and(eq(blogPosts.isPublished, true), lte(blogPosts.publishedAt, new Date().toISOString())))
      .orderBy(desc(blogPosts.publishedAt))

    return rows.map(mapPostFromDb)
  } catch (error) {
    logger.error('Failed to get published posts', { error })
    return []
  }
}

/**
 * Get a single published post by slug (optionally overlaid with a translation).
 */
export async function getPostBySlug(slug: string, locale?: string): Promise<BlogPost | null> {
  try {
    const rows = await db
      .select(postColumns)
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(users, eq(blogPosts.createdBy, users.id))
      .leftJoin(
        blogPostTranslations,
        and(
          eq(blogPostTranslations.postId, blogPosts.id),
          eq(blogPostTranslations.locale, overlayLocale(locale)),
        ),
      )
      .where(
        and(
          eq(blogPosts.slug, slug),
          eq(blogPosts.isPublished, true),
          lte(blogPosts.publishedAt, new Date().toISOString()),
        )
      )

    if (rows.length === 0) return null
    return mapPostFromDb(rows[0])
  } catch (error) {
    logger.error('Failed to get post by slug', { slug, error })
    return null
  }
}

/**
 * Fetch a DB post by slug REGARDLESS of published state (for staff draft
 * preview). Returns the real `published` flag so the page can show a draft
 * banner and keep it out of the public path. Locale-overlaid like the rest.
 */
export async function getDbPostForPreview(slug: string, locale?: string): Promise<BlogPost | null> {
  try {
    const rows = await db
      .select({ ...postColumns, isPub: blogPosts.isPublished })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(users, eq(blogPosts.createdBy, users.id))
      .leftJoin(
        blogPostTranslations,
        and(
          eq(blogPostTranslations.postId, blogPosts.id),
          eq(blogPostTranslations.locale, overlayLocale(locale)),
        ),
      )
      .where(eq(blogPosts.slug, slug))

    if (rows.length === 0) return null
    const post = mapPostFromDb(rows[0])
    post.published = rows[0].isPub ?? false
    return post
  } catch (error) {
    logger.error('Failed to get post for preview', { slug, error })
    return null
  }
}

/**
 * Locales a published DB post exists in: the German base plus every locale that
 * has a translation row. Used to build hreflang alternates alongside file posts.
 */
export async function getDbPostLocales(slug: string): Promise<string[]> {
  try {
    const [base] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)))

    if (!base) return []

    const rows = await db
      .select({ locale: blogPostTranslations.locale })
      .from(blogPostTranslations)
      .where(eq(blogPostTranslations.postId, base.id))

    return [defaultLocale, ...rows.map((r) => r.locale)]
  } catch (error) {
    logger.error('Failed to get DB post locales', { slug, error })
    return []
  }
}

/**
 * Get all blog categories
 */
export async function getAllCategories(): Promise<BlogCategory[]> {
  try {
    const rows = await db
      .select({
        id: blogCategories.id,
        slug: blogCategories.slug,
        name: blogCategories.name,
        description: blogCategories.description,
        color: blogCategories.color,
      })
      .from(blogCategories)
      .orderBy(asc(blogCategories.name))

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      color: row.color,
      isActive: true, // Default to true until is_active column is added
    }))
  } catch (error) {
    logger.error('Failed to get categories', { error })
    return []
  }
}

/**
 * Get posts by category name (for filtering)
 */
export async function getPostsByCategory(categoryName: string, locale?: string): Promise<BlogPost[]> {
  try {
    const rows = await db
      .select(postColumns)
      .from(blogPosts)
      .innerJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(users, eq(blogPosts.createdBy, users.id))
      .leftJoin(
        blogPostTranslations,
        and(
          eq(blogPostTranslations.postId, blogPosts.id),
          eq(blogPostTranslations.locale, overlayLocale(locale)),
        ),
      )
      .where(
        and(
          eq(blogCategories.name, categoryName),
          eq(blogPosts.isPublished, true),
          lte(blogPosts.publishedAt, new Date().toISOString()),
        )
      )
      .orderBy(desc(blogPosts.publishedAt))

    return rows.map(mapPostFromDb)
  } catch (error) {
    logger.error('Failed to get posts by category', { categoryName, error })
    return []
  }
}

/**
 * Map database row to BlogPost interface (compatible with src/lib/blog.ts).
 * Overlays the translation columns when present: title/content come from the
 * translation (content presence marks the row as translated); excerpt falls
 * back to the German base; seo fields use the translation's OWN values (never
 * the German base) so a translated page never gets a German meta description.
 */
function mapPostFromDb(row: {
  slug: string
  title: string
  excerpt: string | null
  content: string
  seoTitle: string | null
  seoDescription: string | null
  featuredImage: string | null
  authorName: string | null
  categoryName: string | null
  tags: string[] | null
  visibility: string
  publishedAt: string | null
  createdAt: string | null
  tTitle?: string | null
  tExcerpt?: string | null
  tContent?: string | null
  tSeoTitle?: string | null
  tSeoDescription?: string | null
  tIsMachine?: boolean | null
}): BlogPost {
  const isTranslated = !!row.tContent
  return {
    slug: row.slug,
    title: row.tTitle || row.title,
    excerpt: (isTranslated ? row.tExcerpt || row.excerpt : row.excerpt) || undefined,
    seoTitle: (isTranslated ? row.tSeoTitle : row.seoTitle) || undefined,
    seoDescription: (isTranslated ? row.tSeoDescription : row.seoDescription) || undefined,
    isMachine: isTranslated ? row.tIsMachine === true : undefined,
    featuredImage: row.featuredImage || undefined,
    author: row.authorName || 'Revamp-IT Team',
    category: row.categoryName || undefined,
    tags: row.tags || [],
    publishedAt: row.publishedAt || undefined,
    published: true, // Only published posts are returned
    body: row.tContent || row.content,
    createdAt: row.createdAt || '',
    visibility:
      row.visibility === 'link' ? 'link' : row.visibility === 'unlisted' ? 'unlisted' : 'public',
  }
}

/**
 * Slugs an admin has "deleted" from the UI. For git/file posts the markdown
 * can't be removed at runtime, so the public readers skip these instead.
 */
export async function getHiddenSlugs(): Promise<Set<string>> {
  try {
    const rows = await db.select({ slug: blogHiddenSlugs.slug }).from(blogHiddenSlugs)
    return new Set(rows.map((r) => r.slug))
  } catch (error) {
    logger.error('Failed to get hidden slugs', { error })
    return new Set()
  }
}
