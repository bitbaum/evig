/**
 * Admin Static Pages Management
 *
 * Manages static pages like About, Contact, FAQ, etc.
 * Data comes from the static_pages table.
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
  CheckCircle,
  Clock,
  ArrowLeft,
  Globe,
} from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'

export const metadata: Metadata = {
  title: 'Statische Seiten',
  description: 'Statische Seiten erstellen und verwalten.',
}

interface StaticPage {
  id: string
  slug: string
  title: string
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

interface PageStats {
  totalPages: number
  publishedPages: number
  draftPages: number
}

async function getPageStats(): Promise<PageStats> {
  let totalPages = 0
  let publishedPages = 0
  let draftPages = 0

  try {
    const totalResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.STATIC_PAGES}`
    )
    totalPages = parseInt(totalResult.rows[0]?.count || '0')

    const publishedResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.STATIC_PAGES} WHERE is_published = true`
    )
    publishedPages = parseInt(publishedResult.rows[0]?.count || '0')

    draftPages = totalPages - publishedPages
  } catch {
    // Table might not exist
  }

  return { totalPages, publishedPages, draftPages }
}

async function getStaticPages(): Promise<StaticPage[]> {
  try {
    const result = await query<StaticPage>(
      `SELECT
        id,
        slug,
        title,
        is_published,
        published_at,
        created_at,
        updated_at
       FROM ${TABLE_NAMES.STATIC_PAGES}
       ORDER BY title ASC`
    )
    return result.rows
  } catch {
    // Table might not exist
    return []
  }
}

export default async function AdminPagesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/content/pages')
  }

  const [stats, pages] = await Promise.all([getPageStats(), getStaticPages()])

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
              Statische Seiten
            </Heading>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Über uns, Kontakt, FAQ und andere Seiten verwalten
            </p>
          </div>
        </div>
        <Link
          href="/admin/content/pages/new"
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Neue Seite
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Gesamt Seiten
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats.totalPages}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Veröffentlicht
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats.publishedPages}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Entwürfe
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats.draftPages}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 overflow-hidden">
        {pages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Seite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Aktualisiert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                {pages.map((page) => (
                  <tr
                    key={page.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">
                        {page.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded">
                        /{page.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          page.is_published
                            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}
                      >
                        {page.is_published ? 'Veröffentlicht' : 'Entwurf'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900 dark:text-white">
                        {page.updated_at ? formatDateNumeric(page.updated_at) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${page.slug}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          target="_blank"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/content/pages/${page.id}`}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <Heading level={3} className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              Noch keine Seiten
            </Heading>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Erstelle statische Seiten wie Über uns, Kontakt oder FAQ.
            </p>
            <Link
              href="/admin/content/pages/new"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Erste Seite erstellen
            </Link>
          </div>
        )}
      </div>

      {/* Common Pages Suggestion */}
      {pages.length === 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
          <Heading level={3} className="font-medium text-purple-900 dark:text-purple-200 mb-3">
            Empfohlene Seiten
          </Heading>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { title: 'Über uns', slug: 'ueber-uns' },
              { title: 'Kontakt', slug: 'kontakt' },
              { title: 'FAQ', slug: 'faq' },
              { title: 'Datenschutz', slug: 'datenschutz' },
              { title: 'Impressum', slug: 'impressum' },
              { title: 'AGB', slug: 'agb' },
              { title: 'Team', slug: 'team' },
              { title: 'Partner', slug: 'partner' },
            ].map((suggestion) => (
              <Link
                key={suggestion.slug}
                href={`/admin/content/pages/new?title=${encodeURIComponent(suggestion.title)}&slug=${suggestion.slug}`}
                className="flex items-center gap-2 p-3 bg-white dark:bg-neutral-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <Plus className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {suggestion.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <Heading level={3} className="font-medium text-blue-900 dark:text-blue-200">
              Statische Seiten
            </Heading>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Statische Seiten enthalten wichtige Informationen über Ihre
              Organisation. Diese erscheinen in der Navigation und im Footer der
              Website. Vergiss nicht, rechtlich erforderliche Seiten wie
              Impressum und Datenschutz zu erstellen.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
