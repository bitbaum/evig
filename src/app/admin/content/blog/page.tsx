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
import { getAllPosts as getFilePosts } from '@/lib/blog'
import { getHiddenSlugs } from '@/lib/blog-db'
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
import { canAccessSection, toStaffUser } from '@/lib/permissions'

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
  // `db` posts are authored in this UI (editable/deletable); `file` posts live
  // in content/posts/*.md and are managed in Git (read-only here).
  source: 'db' | 'file'
  visibility: 'public' | 'unlisted' | 'link'
}

interface BlogStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  categoriesCount: number
}

interface DbBlogRow {
  id: string
  slug: string
  title: string
  excerpt: string | null
  is_published: boolean
  visibility: string
  published_at: string | null
  created_at: string
  updated_at: string
  category_name: string | null
}

/**
 * Unified admin list: DB posts (this UI) + git file posts (content/posts/*.md),
 * deduped by slug so staff see EVERY article regardless of where it lives. File
 * posts are marked read-only. The admin area is German-only, so file posts
 * resolve to their German version.
 */
async function getBlogPosts(): Promise<BlogPost[]> {
  let dbPosts: BlogPost[] = []
  try {
    const result = await query<DbBlogRow>(
      `SELECT
        bp.id,
        bp.slug,
        bp.title,
        bp.excerpt,
        bp.is_published,
        bp.visibility,
        bp.published_at,
        bp.created_at,
        bp.updated_at,
        c.name as category_name
       FROM ${TABLE_NAMES.BLOG_POSTS} bp
       LEFT JOIN ${TABLE_NAMES.BLOG_CATEGORIES} c ON bp.category_id = c.id
       ORDER BY bp.created_at DESC
       LIMIT 50`
    )
    dbPosts = result.rows.map((r): BlogPost => ({
      ...r,
      source: 'db',
      visibility: r.visibility === 'unlisted' ? 'unlisted' : r.visibility === 'link' ? 'link' : 'public',
    }))
  } catch {
    // Table might not exist — fall through to file posts only.
  }

  const dbSlugs = new Set(dbPosts.map((p) => p.slug))
  const hidden = await getHiddenSlugs()
  const filePosts: BlogPost[] = getFilePosts('de')
    .filter((p) => !dbSlugs.has(p.slug) && !hidden.has(p.slug))
    .map((p) => ({
      id: `file:${p.slug}`,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? null,
      is_published: p.published ?? true,
      published_at: p.publishedAt ?? null,
      created_at: p.createdAt,
      updated_at: p.createdAt,
      category_name: p.category ?? null,
      source: 'file',
      visibility: p.visibility ?? 'public',
    }))

  return [...dbPosts, ...filePosts].sort((a, b) => {
    const da = new Date(a.published_at || a.created_at).getTime()
    const db = new Date(b.published_at || b.created_at).getTime()
    return db - da
  })
}

function computeBlogStats(posts: BlogPost[]): BlogStats {
  const publishedPosts = posts.filter((p) => p.is_published).length
  const categoriesCount = new Set(
    posts.map((p) => p.category_name).filter(Boolean) as string[]
  ).size
  return {
    totalPosts: posts.length,
    publishedPosts,
    draftPosts: posts.length - publishedPosts,
    categoriesCount,
  }
}

export default async function AdminBlogPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/content/blog')
  }
  if (!canAccessSection(toStaffUser(session.user), 'content')) {
    redirect('/?error=no_admin_access')
  }

  const posts = await getBlogPosts()
  const stats = computeBlogStats(posts)

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
