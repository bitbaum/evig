/**
 * Blog Database Functions
 *
 * Reads blog posts from the database for public display.
 * Admin writes to database, public reads from database.
 * SSOT: Database is the single source of truth for blog content.
 *
 * Interface matches src/lib/blog.ts for backward compatibility with components.
 */

import { db } from '@/db'
import { blogPosts, blogCategories } from '@/db/schema/content'
import { users } from '@/db/schema/auth'
import { eq, and, lte, desc, asc } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import type { BlogPost } from '@/lib/blog'

export type { BlogPost }

export interface BlogCategory {
  id: string
  slug: string
  name: string
  description: string | null
  color: string | null
  isActive: boolean
}

/**
 * Get all published blog posts
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const rows = await db
      .select({
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        featuredImage: blogPosts.featuredImage,
        authorName: users.name,
        categoryName: blogCategories.name,
        tags: blogPosts.tags,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(users, eq(blogPosts.createdBy, users.id))
      .where(and(eq(blogPosts.isPublished, true), lte(blogPosts.publishedAt, new Date().toISOString())))
      .orderBy(desc(blogPosts.publishedAt))

    return rows.map(mapPostFromDb)
  } catch (error) {
    logger.error('Failed to get published posts', { error })
    return []
  }
}

/**
 * Get a single published post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const rows = await db
      .select({
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        featuredImage: blogPosts.featuredImage,
        authorName: users.name,
        categoryName: blogCategories.name,
        tags: blogPosts.tags,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(users, eq(blogPosts.createdBy, users.id))
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
export async function getPostsByCategory(categoryName: string): Promise<BlogPost[]> {
  try {
    const rows = await db
      .select({
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        featuredImage: blogPosts.featuredImage,
        authorName: users.name,
        categoryName: blogCategories.name,
        tags: blogPosts.tags,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
      })
      .from(blogPosts)
      .innerJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(users, eq(blogPosts.createdBy, users.id))
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
 * Map database row to BlogPost interface (compatible with src/lib/blog.ts)
 */
function mapPostFromDb(row: {
  slug: string
  title: string
  excerpt: string | null
  content: string
  featuredImage: string | null
  authorName: string | null
  categoryName: string | null
  tags: string[] | null
  publishedAt: string | null
  createdAt: string | null
}): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || undefined,
    featuredImage: row.featuredImage || undefined,
    author: row.authorName || 'Revamp-IT Team',
    category: row.categoryName || undefined,
    tags: row.tags || [],
    publishedAt: row.publishedAt || undefined,
    published: true, // Only published posts are returned
    body: row.content,
    createdAt: row.createdAt || '',
  }
}
