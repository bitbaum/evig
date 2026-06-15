/**
 * Admin Blog Categories Page
 *
 * Manages blog categories - view, create, edit, delete.
 * Data comes from the main database blog_categories table.
 */

import { Metadata } from 'next'
import { adminInteractive, adminTable } from '@/lib/admin-ui'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-class'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Plus,
  Tag,
  Edit,
  Trash2,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={ROUTES.admin.content}
            className={`p-2 ${adminInteractive.rowHover} rounded-lg transition-colors`}
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <Heading level={1} className="text-2xl font-bold text-text-primary">
              Blog-Kategorien
            </Heading>
            <p className="text-text-secondary mt-1">
              Kategorien für Blog-Artikel verwalten
            </p>
          </div>
        </div>
        <Link href={ROUTES.admin.categoryNew} className={buttonClass({ variant: 'primary' })}>
          <Plus className="w-5 h-5" />
          Neue Kategorie
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle">
          <div className="flex items-center gap-3">
            <Tag className="w-8 h-8 text-action" />
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Gesamt Kategorien
              </p>
              <p className="text-2xl font-bold text-text-primary">
                {stats.totalCategories}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-action" />
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Aktive Kategorien
              </p>
              <p className="text-2xl font-bold text-text-primary">
                {stats.activeCategories}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle">
          <div className="flex items-center gap-3">
            <Tag className="w-8 h-8 text-text-secondary" />
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Artikel gesamt
              </p>
              <p className="text-2xl font-bold text-text-primary">
                {stats.totalPosts}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-surface-base rounded-xl shadow-xs border border-subtle overflow-hidden">
        {categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-raised">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Kategorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Farbe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Artikel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-base divide-y divide-neutral-200 dark:divide-white/4">
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className={adminTable.tr}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {category.name}
                        </div>
                        {category.description && (
                          <div className="text-sm text-text-tertiary line-clamp-1">
                            {category.description}
                          </div>
                        )}
                        <div className="text-xs text-text-tertiary mt-1">
                          /{category.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.color ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border border"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm text-text-secondary font-mono">
                            {category.color}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-text-muted">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-text-primary">
                        {category.post_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          category.is_active
                            ? 'bg-action-muted text-action-muted'
                            : 'bg-surface-raised text-text-primary'
                        }`}
                      >
                        {category.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Aktiv
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inaktiv
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/content/categories/${category.id}`}
                          className="text-action hover:text-action"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Button
                          variant="destructive-ghost"
                          size="icon"
                          className="text-error-600 hover:text-error-900 dark:text-error-400 dark:hover:text-error-300 disabled:opacity-50"
                          disabled={category.post_count > 0}
                          title={
                            category.post_count > 0
                              ? 'Kategorie hat Artikel und kann nicht gelöscht werden'
                              : 'Kategorie löschen'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Tag}
            title="Noch keine Kategorien"
            description="Erstelle Kategorien, um deine Blog-Artikel zu organisieren."
            action={
              <Link href={ROUTES.admin.categoryNew} className={buttonClass({ variant: 'primary' })}>
                <Plus className="w-5 h-5" />
                Erste Kategorie erstellen
              </Link>
            }
          />
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-surface-raised border border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-surface-raised rounded-lg flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5 text-text-secondary" />
          </div>
          <div>
            <Heading level={3} className="font-medium text-text-primary">
              Kategorien-Verwaltung
            </Heading>
            <p className="text-sm text-text-secondary mt-1">
              Kategorien helfen beim Organisieren Ihrer Blog-Artikel. Jede
              Kategorie kann eine eigene Farbe und Beschreibung haben. Aktive
              Kategorien erscheinen in der Auswahl beim Erstellen neuer Artikel.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
