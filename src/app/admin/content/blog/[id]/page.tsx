/**
 * Admin: Edit Blog Post
 *
 * Form to edit an existing blog post.
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { BlogPostForm } from '@/components/admin/BlogPostForm'
import { canAccessSection, toStaffUser } from '@/lib/permissions'

export const metadata: Metadata = {
  title: 'Artikel bearbeiten',
  description: 'Blog-Artikel bearbeiten.',
}

interface PageProps {
  params: Promise<{ id: string }>
}

async function getBlogPost(id: string) {
  try {
    const result = await query<{
      id: string
      slug: string
      title: string
      excerpt: string | null
      content: string
      featured_image: string | null
      category_id: string | null
      tags: string[]
      is_published: boolean
      seo_title: string | null
      seo_description: string | null
    }>(
      `SELECT
        id, slug, title, excerpt, content,
        featured_image, category_id, tags,
        is_published, seo_title, seo_description
      FROM ${TABLE_NAMES.BLOG_POSTS}
      WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) return null

    const post = result.rows[0]

    // Load translation overlays so the editor's language tabs are prefilled.
    const translationRows = await query<{
      locale: string
      title: string
      excerpt: string | null
      content: string
      seo_title: string | null
      seo_description: string | null
    }>(
      `SELECT locale, title, excerpt, content, seo_title, seo_description
       FROM ${TABLE_NAMES.BLOG_POST_TRANSLATIONS}
       WHERE post_id = $1`,
      [id]
    )

    const translations: Record<
      string,
      { title: string; excerpt: string; content: string; seoTitle: string; seoDescription: string }
    > = {}
    for (const row of translationRows.rows) {
      translations[row.locale] = {
        title: row.title,
        excerpt: row.excerpt || '',
        content: row.content,
        seoTitle: row.seo_title || '',
        seoDescription: row.seo_description || '',
      }
    }

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      featuredImage: post.featured_image || '',
      categoryId: post.category_id || '',
      tags: post.tags || [],
      isPublished: post.is_published,
      seoTitle: post.seo_title || '',
      seoDescription: post.seo_description || '',
      translations,
    }
  } catch {
    return null
  }
}

export default async function EditBlogPostPage({ params }: PageProps) {
  const { id: postId } = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/admin/content/blog/${postId}`)
  }
  if (!canAccessSection(toStaffUser(session.user), 'content')) {
    redirect('/?error=no_admin_access')
  }

  const post = await getBlogPost(postId)

  if (!post) {
    notFound()
  }

  return <BlogPostForm initialData={post} isEdit />
}
