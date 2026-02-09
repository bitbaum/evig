/**
 * Admin Blog Posts Page
 *
 * Manages blog posts - view, create, edit, publish.
 * Data comes from the main database blog_posts table.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { formatDateNumeric } from '@/lib/date-formats'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import {
  Plus,
  FileText,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  ArrowLeft,
  Calendar,
  Tag,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog-Artikel | RevampIT Admin',
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return formatDateNumeric(dateStr)
}

export default async function AdminBlogPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/content/blog')
  }

  const [stats, posts] = await Promise.all([getBlogStats(), getBlogPosts()])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/content"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Blog-Artikel
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              News, Tutorials und Ankündigungen verwalten
            </p>
          </div>
        </div>
        <Link
          href="/admin/content/blog/new"
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Neuer Artikel
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Gesamt Artikel
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalPosts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Veröffentlicht
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.publishedPosts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Entwürfe
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.draftPosts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Tag className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Kategorien
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.categoriesCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {posts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Titel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Kategorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {post.title}
                        </div>
                        {post.excerpt && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {post.excerpt}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {post.category_name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          post.is_published
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}
                      >
                        {post.is_published ? 'Veröffentlicht' : 'Entwurf'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(post.published_at || post.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {post.is_published && post.published_at && new Date(post.published_at) <= new Date() ? (
                          <Link
                            href={`/blog/${post.slug}`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            target="_blank"
                            title="Artikel ansehen"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        ) : (
                          <span
                            className="text-gray-300 dark:text-gray-600 cursor-not-allowed"
                            title="Artikel muss veröffentlicht sein"
                          >
                            <Eye className="w-4 h-4" />
                          </span>
                        )}
                        <Link
                          href={`/admin/content/blog/${post.id}`}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Artikel bearbeiten"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Artikel löschen"
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
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Noch keine Blog-Artikel
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Erstellen Sie Ihren ersten Blog-Artikel, um News und Tutorials zu
              teilen.
            </p>
            <Link
              href="/admin/content/blog/new"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Ersten Artikel erstellen
            </Link>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-200">
              Blog-Verwaltung
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 mb-3">
              Blog-Artikel sind ein wichtiger Kommunikationskanal. Teilen Sie
              News über RevampIT, schreiben Sie Tutorials zur
              Computeraufarbeitung oder kündigen Sie Workshops und Events an.
            </p>
            <div className="flex gap-3">
              <Link
                href="/admin/content/blog/new"
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
              >
                Artikel erstellen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
