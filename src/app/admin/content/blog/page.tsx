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
  MessageSquare,
  AlertTriangle,
} from 'lucide-react'
import { logger } from '@/lib/logger'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsStrip, type StatItem } from '@/components/admin/AdminStatsStrip'
import { AdminButton } from '@/components/admin/AdminButton'
import { Pagination } from '@/components/ui/Pagination'
import { ADMIN_CONTENT } from '@/config/admin-content'
import { ADMIN_BLOG_PAGE_SIZE } from '@/config/blog'
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
 * Unified admin list: DB posts (this UI, paginated in SQL) + git file posts
 * (content/posts/*.md, shown on page 1 — a small, git-bounded set), deduped by
 * slug so staff see EVERY article regardless of where it lives. File posts are
 * marked read-only. File posts resolve to their canonical German version
 * (DE is the content source of truth, whatever the admin's UI language).
 * Stats come from SQL aggregates over ALL rows, not the
 * fetched page.
 */
async function getBlogPosts(page: number): Promise<{
  posts: BlogPost[]
  stats: BlogStats
  currentPage: number
  totalPages: number
  totalDbPosts: number
  dbError: boolean
}> {
  let dbPosts: BlogPost[] = []
  let dbError = false
  let totalDbPosts = 0
  let publishedDb = 0
  const usedCategoryNames = new Set<string>()

  try {
    const agg = await query<{ total: number; published: number }>(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE is_published)::int AS published
       FROM ${TABLE_NAMES.BLOG_POSTS}`
    )
    totalDbPosts = agg.rows[0]?.total ?? 0
    publishedDb = agg.rows[0]?.published ?? 0

    // Distinct category NAMES (not ids) so the union with file-post categories
    // doesn't double-count a name that exists in both sources.
    const cats = await query<{ name: string }>(
      `SELECT DISTINCT c.name
       FROM ${TABLE_NAMES.BLOG_POSTS} bp
       JOIN ${TABLE_NAMES.BLOG_CATEGORIES} c ON bp.category_id = c.id`
    )
    for (const row of cats.rows) usedCategoryNames.add(row.name)
  } catch (error) {
    dbError = true
    logger.error('Admin blog list: DB aggregate query failed', { error })
  }

  const totalPages = Math.max(1, Math.ceil(totalDbPosts / ADMIN_BLOG_PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  if (!dbError) {
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
         LIMIT $1 OFFSET $2`,
        [ADMIN_BLOG_PAGE_SIZE, (currentPage - 1) * ADMIN_BLOG_PAGE_SIZE]
      )
      dbPosts = result.rows.map((r): BlogPost => ({
        ...r,
        source: 'db',
        visibility: r.visibility === 'unlisted' ? 'unlisted' : r.visibility === 'link' ? 'link' : 'public',
      }))
    } catch (error) {
      // DB unreachable or query failed — surface it rather than silently showing
      // a partial (file-only) list that looks like the real state.
      dbError = true
      logger.error('Admin blog list: DB query failed, showing file posts only', { error })
    }
  }

  const dbSlugs = new Set(dbPosts.map((p) => p.slug))
  const hidden = await getHiddenSlugs()
  const allFilePosts = getFilePosts('de').filter((p) => !hidden.has(p.slug))
  // File posts appear on page 1 only — they're a handful of git-managed
  // articles, not a growing set; repeating them on every page would be noise.
  const filePosts: BlogPost[] = currentPage === 1
    ? allFilePosts
        .filter((p) => !dbSlugs.has(p.slug))
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
    : []

  const posts = [...dbPosts, ...filePosts].sort((a, b) => {
    const da = new Date(a.published_at || a.created_at).getTime()
    const db = new Date(b.published_at || b.created_at).getTime()
    return db - da
  })

  // Stats span ALL posts (SQL aggregates + file posts), not just this page.
  const filePublished = allFilePosts.filter((p) => p.published ?? true).length
  for (const p of allFilePosts) {
    if (p.category) usedCategoryNames.add(p.category)
  }
  const stats: BlogStats = {
    totalPosts: totalDbPosts + allFilePosts.length,
    publishedPosts: publishedDb + filePublished,
    draftPosts: totalDbPosts + allFilePosts.length - publishedDb - filePublished,
    categoriesCount: usedCategoryNames.size,
  }

  return { posts, stats, currentPage, totalPages, totalDbPosts, dbError }
}

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/content/blog')
  }
  if (!canAccessSection(toStaffUser(session.user), 'content')) {
    redirect('/?error=no_admin_access')
  }

  const { page } = await searchParams
  const requestedPage = Number.parseInt(page || '1', 10) || 1
  const { posts, stats, currentPage, totalPages, totalDbPosts, dbError } =
    await getBlogPosts(requestedPage)

  const createAction = (
    <div className="flex flex-wrap items-center gap-2">
      <AdminButton href={ROUTES.admin.contentBlogComments} variant="secondary" className="gap-2">
        <MessageSquare className="w-4 h-4" />
        Kommentare
      </AdminButton>
      <AdminButton href={ROUTES.admin.contentBlogNew} variant="primary" className="gap-2">
        <Plus className="w-4 h-4" />
        Neuer Artikel
      </AdminButton>
    </div>
  )

  const dbErrorBanner = dbError ? (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning-300 bg-warning-50 p-4 text-warning-800 dark:border-warning-800 dark:bg-warning-950 dark:text-warning-200">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="text-sm">
        <p className="font-medium">Datenbank nicht erreichbar</p>
        <p className="mt-0.5">
          Nur Git-basierte Artikel werden angezeigt. In der Datenbank gespeicherte Artikel fehlen möglicherweise
          in dieser Liste, bis die Verbindung wiederhergestellt ist.
        </p>
      </div>
    </div>
  ) : null

  // No posts yet → single empty state, no dead stats grid. (Only when the DB is
  // healthy — a DB error with zero posts must show the warning, not "no posts".)
  if (posts.length === 0 && !dbError) {
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

  const statCards: StatItem[] = [
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
      {dbErrorBanner}
      <AdminStatsStrip items={statCards} />
      <BlogListClient posts={posts} />
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalDbPosts}
          pageSize={ADMIN_BLOG_PAGE_SIZE}
          hrefBase={ROUTES.admin.contentBlog}
        />
      )}
    </AdminPageWrapper>
  )
}
