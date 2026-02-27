/**
 * Blog Database Functions
 *
 * Reads blog posts from the database for public display.
 * Admin writes to database, public reads from database.
 * SSOT: Database is the single source of truth for blog content.
 *
 * Interface matches src/lib/blog.ts for backward compatibility with components.
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
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

// Database row type for blog posts (matches existing schema)
interface DbBlogPost {
  slug: string
  title: string
  excerpt: string | null
  content: string
  featured_image: string | null
  author_name: string | null
  category_name: string | null
  tags: string[]
  published_at: string | null
  created_at: string
}

/**
 * Get all published blog posts
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const result = await query<DbBlogPost>(
      `SELECT
        p.slug, p.title, p.excerpt, p.content,
        p.featured_image,
        u.name as author_name,
        c.name as category_name,
        p.tags, p.published_at, p.created_at
      FROM ${TABLE_NAMES.BLOG_POSTS} p
      LEFT JOIN ${TABLE_NAMES.BLOG_CATEGORIES} c ON p.category_id = c.id
      LEFT JOIN ${TABLE_NAMES.USERS} u ON p.created_by = u.id
      WHERE p.is_published = true AND p.published_at <= NOW()
      ORDER BY p.published_at DESC`
    )

    return result.rows.map(mapPostFromDb)
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
    const result = await query<DbBlogPost>(
      `SELECT
        p.slug, p.title, p.excerpt, p.content,
        p.featured_image,
        u.name as author_name,
        c.name as category_name,
        p.tags, p.published_at, p.created_at
      FROM ${TABLE_NAMES.BLOG_POSTS} p
      LEFT JOIN ${TABLE_NAMES.BLOG_CATEGORIES} c ON p.category_id = c.id
      LEFT JOIN ${TABLE_NAMES.USERS} u ON p.created_by = u.id
      WHERE p.slug = $1 AND p.is_published = true AND p.published_at <= NOW()`,
      [slug]
    )

    if (result.rows.length === 0) return null
    return mapPostFromDb(result.rows[0])
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
    const result = await query<{
      id: string
      slug: string
      name: string
      description: string | null
      color: string | null
    }>(
      `SELECT id, slug, name, description, color
      FROM ${TABLE_NAMES.BLOG_CATEGORIES}
      ORDER BY name`
    )

    return result.rows.map((row) => ({
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
    const result = await query<DbBlogPost>(
      `SELECT
        p.slug, p.title, p.excerpt, p.content,
        p.featured_image,
        u.name as author_name,
        c.name as category_name,
        p.tags, p.published_at, p.created_at
      FROM ${TABLE_NAMES.BLOG_POSTS} p
      JOIN ${TABLE_NAMES.BLOG_CATEGORIES} c ON p.category_id = c.id
      LEFT JOIN ${TABLE_NAMES.USERS} u ON p.created_by = u.id
      WHERE c.name = $1 AND p.is_published = true AND p.published_at <= NOW()
      ORDER BY p.published_at DESC`,
      [categoryName]
    )

    return result.rows.map(mapPostFromDb)
  } catch (error) {
    logger.error('Failed to get posts by category', { categoryName, error })
    return []
  }
}

/**
 * Map database row to BlogPost interface (compatible with src/lib/blog.ts)
 */
function mapPostFromDb(row: DbBlogPost): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || undefined,
    featuredImage: row.featured_image || undefined,
    author: row.author_name || 'RevampIT Team',
    category: row.category_name || undefined,
    tags: row.tags || [],
    publishedAt: row.published_at || undefined,
    published: true, // Only published posts are returned
    body: row.content,
    createdAt: row.created_at,
  }
}
