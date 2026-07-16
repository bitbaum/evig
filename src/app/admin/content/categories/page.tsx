/**
 * Admin Blog Categories Page
 *
 * Manages blog categories - view, create, edit, delete.
 * Data comes from the main database blog_categories table.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Plus,
  Tag,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsStrip, type StatItem } from '@/components/admin/AdminStatsStrip'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { AdminButton } from '@/components/admin/AdminButton'
import { ROUTES } from '@/config/routes'

export const metadata: Metadata = {
  title: 'Kategorien',
  description: 'Blog-Kategorien erstellen und verwalten.',
}

interface BlogCategory {
  id: string
  slug: string
  name: string
  description: string | null
  color: string | null
  sort_order: number
  is_active: boolean
  post_count: number
}

interface CategoryStats {
  totalCategories: number
  activeCategories: number
  totalPosts: number
}

async function getCategoryStats(): Promise<CategoryStats> {
  let totalCategories = 0
  let activeCategories = 0
  let totalPosts = 0

  try {
    const totalResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.BLOG_CATEGORIES}`
    )
    totalCategories = parseInt(totalResult.rows[0]?.count || '0')

    const activeResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.BLOG_CATEGORIES} WHERE is_active = true`
    )
    activeCategories = parseInt(activeResult.rows[0]?.count || '0')

    const postsResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.BLOG_POSTS}`
    )
    totalPosts = parseInt(postsResult.rows[0]?.count || '0')
  } catch {
    // Tables might not exist
  }

  return { totalCategories, activeCategories, totalPosts }
}

async function getCategories(): Promise<BlogCategory[]> {
  try {
    const result = await query<BlogCategory>(
      `SELECT
        c.id,
        c.slug,
        c.name,
        c.description,
        c.color,
        c.sort_order,
        c.is_active,
        COUNT(bp.id)::int as post_count
       FROM ${TABLE_NAMES.BLOG_CATEGORIES} c
       LEFT JOIN ${TABLE_NAMES.BLOG_POSTS} bp ON bp.category_id = c.id
       GROUP BY c.id
       ORDER BY c.sort_order, c.name`
    )
    return result.rows
  } catch {
    // Table might not exist
    return []
  }
}

export default async function AdminCategoriesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/content/categories')
  }

  const [stats, categories] = await Promise.all([
    getCategoryStats(),
    getCategories(),
  ])

  const createAction = (
    <AdminButton href={ROUTES.admin.categoryNew} variant="primary" className="gap-2">
      <Plus className="w-4 h-4" />
      Neue Kategorie
    </AdminButton>
  )

  const columns: AdminTableColumn<BlogCategory>[] = [
    {
      header: 'Kategorie',
      cell: (c) => (
        <div>
          <div className="text-sm font-medium text-text-primary">{c.name}</div>
          {c.description && <div className="text-sm text-text-tertiary line-clamp-1">{c.description}</div>}
          <div className="text-xs text-text-tertiary mt-1">/{c.slug}</div>
        </div>
      ),
    },
    {
      header: 'Farbe',
      className: 'whitespace-nowrap',
      cell: (c) =>
        c.color ? (
          <div className="flex items-center gap-2">
            {/* dynamic data colour → inline style is legitimate here */}
            <div className="w-6 h-6 rounded-full border border-default" style={{ backgroundColor: c.color }} />
            <span className="text-sm text-text-secondary font-mono">{c.color}</span>
          </div>
        ) : (
          <span className="text-sm text-text-muted">-</span>
        ),
    },
    { header: 'Artikel', className: 'whitespace-nowrap', cell: (c) => <span className="text-sm text-text-primary">{c.post_count}</span> },
    {
      header: 'Status',
      className: 'whitespace-nowrap',
      cell: (c) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
          c.is_active ? 'bg-action-muted text-action' : 'bg-surface-raised text-text-primary'
        }`}>
          {c.is_active ? <><CheckCircle className="w-3 h-3" />Aktiv</> : <><XCircle className="w-3 h-3" />Inaktiv</>}
        </span>
      ),
    },
    {
      header: 'Aktionen',
      className: 'whitespace-nowrap',
      cell: (c) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/content/categories/${c.id}`} className="text-action hover:text-action">
            <Edit className="w-4 h-4" />
          </Link>
          <Button
            variant="destructive-ghost"
            size="icon"
            className="text-error-600 hover:text-error-900 dark:text-error-400 dark:hover:text-error-300 disabled:opacity-50"
            disabled={c.post_count > 0}
            title={c.post_count > 0 ? 'Kategorie hat Artikel und kann nicht gelöscht werden' : 'Kategorie löschen'}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AdminPageWrapper
      title="Blog-Kategorien"
      description="Kategorien für Blog-Artikel verwalten"
      icon={Tag}
      backButton={{ href: ROUTES.admin.content, label: 'Inhalte' }}
      actions={createAction}
    >
      {categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Noch keine Kategorien"
          description="Erstelle Kategorien, um deine Blog-Artikel zu organisieren."
          action={createAction}
        />
      ) : (
        <>
          <AdminStatsStrip
            items={[
              { icon: Tag, color: 'gray', label: 'Gesamt Kategorien', value: stats.totalCategories },
              { icon: CheckCircle, color: 'green', label: 'Aktive Kategorien', value: stats.activeCategories },
              { icon: Tag, color: 'gray', label: 'Artikel gesamt', value: stats.totalPosts },
            ] satisfies StatItem[]}
          />
          <AdminTable columns={columns} rows={categories} rowKey={(c) => c.id} />
        </>
      )}
    </AdminPageWrapper>
  )
}
