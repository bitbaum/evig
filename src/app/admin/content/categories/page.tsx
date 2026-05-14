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
            href="/admin/content"
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </Link>
          <div>
            <Heading level={1} className="text-2xl font-bold text-neutral-900 dark:text-white">
              Blog-Kategorien
            </Heading>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Kategorien für Blog-Artikel verwalten
            </p>
          </div>
        </div>
        <Link
          href="/admin/content/categories/new"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Neue Kategorie
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <Tag className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Gesamt Kategorien
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats.totalCategories}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Aktive Kategorien
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats.activeCategories}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <Tag className="w-8 h-8 text-info-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Artikel gesamt
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats.totalPosts}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 overflow-hidden">
        {categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Kategorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Farbe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Artikel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-neutral-900 dark:text-white">
                          {category.name}
                        </div>
                        {category.description && (
                          <div className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                            {category.description}
                          </div>
                        )}
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          /{category.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.color ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border border-neutral-200 dark:border-neutral-600"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm text-neutral-600 dark:text-neutral-400 font-mono">
                            {category.color}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-neutral-900 dark:text-white">
                        {category.post_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          category.is_active
                            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                            : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-300'
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
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          className="text-error-600 hover:text-error-900 dark:text-error-400 dark:hover:text-error-300 disabled:opacity-50"
                          disabled={category.post_count > 0}
                          title={
                            category.post_count > 0
                              ? 'Kategorie hat Artikel und kann nicht gelöscht werden'
                              : 'Kategorie löschen'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <Heading level={3} className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              Noch keine Kategorien
            </Heading>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Erstelle Kategorien, um deine Blog-Artikel zu organisieren.
            </p>
            <Link
              href="/admin/content/categories/new"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Erste Kategorie erstellen
            </Link>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-info-100 dark:bg-info-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Tag className="w-5 h-5 text-info-600" />
          </div>
          <div>
            <Heading level={3} className="font-medium text-info-900 dark:text-info-200">
              Kategorien-Verwaltung
            </Heading>
            <p className="text-sm text-info-700 dark:text-info-300 mt-1">
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
