/**
 * Admin Blog Posts Page
 *
 * Manages blog posts - view, create, edit, publish.
 * Data comes from the main database blog_posts table.
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  Tag,
} from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsGrid, type StatCardItem } from '@/components/admin/AdminStatsGrid'
import { AdminButton } from '@/components/admin/AdminButton'
import { ADMIN_CONTENT } from '@/config/admin-content'
import { BlogListClient } from './BlogListClient'
import { ROUTES } from '@/config/routes'

export const metadata: Metadata = {
  title: 'Blog-Artikel',
  description: 'Blog-Artikel erstellen und verwalten.',
}

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  category_name: string | null
}

interface BlogStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  categoriesCount: number
}

async function getBlogStats(): Promise<BlogStats> {
  let totalPosts = 0
  let publishedPosts = 0
  let draftPosts = 0
  let categoriesCount = 0

  try {
    const totalResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.BLOG_POSTS}`
    )
    totalPosts = parseInt(totalResult.rows[0]?.count || '0')

    const publishedResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.BLOG_POSTS} WHERE is_published = true`
    )
    publishedPosts = parseInt(publishedResult.rows[0]?.count || '0')

    draftPosts = totalPosts - publishedPosts
  } catch {
    // Table might not exist
  }

  try {
    const catResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.BLOG_CATEGORIES} WHERE is_active = true`
    )
    categoriesCount = parseInt(catResult.rows[0]?.count || '0')
  } catch {
    // Table might not exist
  }

  return { totalPosts, publishedPosts, draftPosts, categoriesCount }
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const result = await query<BlogPost>(
      `SELECT
        bp.id,
        bp.slug,
        bp.title,
        bp.excerpt,
        bp.is_published,
        bp.published_at,
        bp.created_at,
        bp.updated_at,
        c.name as category_name
       FROM ${TABLE_NAMES.BLOG_POSTS} bp
       LEFT JOIN ${TABLE_NAMES.BLOG_CATEGORIES} c ON bp.category_id = c.id
       ORDER BY bp.created_at DESC
       LIMIT 50`
    )
    return result.rows
  } catch {
    // Table might not exist
    return []
  }
}

export default async function AdminBlogPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/content/blog')
  }

  const [stats, posts] = await Promise.all([getBlogStats(), getBlogPosts()])

  const createAction = (
    <AdminButton href={ROUTES.admin.contentBlogNew} variant="primary" className="gap-2">
      <Plus className="w-4 h-4" />
      Neuer Artikel
    </AdminButton>
  )

  // No posts yet → single empty state, no dead stats grid.
  if (posts.length === 0) {
    return (
      <AdminPageWrapper
        title="Blog-Artikel"
        description="News, Tutorials und Ankündigungen verwalten"
        icon={FileText}
        iconColor="blue"
        backButton={{ href: ROUTES.admin.content, label: 'Zurück' }}
        actions={createAction}
      >
        <div className="rounded-lg border border-default bg-surface-base p-12 text-center">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="font-medium text-text-primary">{ADMIN_CONTENT.blog.emptyTitle}</p>
          <p className="text-text-secondary mt-1 mb-6">{ADMIN_CONTENT.blog.emptyDescription}</p>
          {createAction}
        </div>
      </AdminPageWrapper>
    )
  }

  const statCards: StatCardItem[] = [
    { icon: FileText, color: 'gray', label: 'Gesamt Artikel', value: stats.totalPosts },
    { icon: CheckCircle, color: 'green', label: 'Veröffentlicht', value: stats.publishedPosts },
    { icon: Clock, color: 'gray', label: 'Entwürfe', value: stats.draftPosts },
    { icon: Tag, color: 'gray', label: 'Kategorien', value: stats.categoriesCount },
  ]

  return (
    <AdminPageWrapper
      title="Blog-Artikel"
      description="News, Tutorials und Ankündigungen verwalten"
      icon={FileText}
      iconColor="blue"
      backButton={{ href: ROUTES.admin.content, label: 'Zurück' }}
      actions={createAction}
    >
      <AdminStatsGrid items={statCards} />
      <BlogListClient posts={posts} />
    </AdminPageWrapper>
  )
}
