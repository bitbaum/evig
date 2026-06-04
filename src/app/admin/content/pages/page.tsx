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
import { buttonClass } from '@/components/ui/button-class'
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
  AlertTriangle,
} from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { ROUTES } from '@/config/routes'

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
            href={ROUTES.admin.content}
            className="p-2 hover:bg-surface-raised dark:hover:bg-surface-base/6 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <Heading level={1} className="text-2xl font-bold text-text-primary">
              Statische Seiten
            </Heading>
            <p className="text-text-secondary mt-1">
              Über uns, Kontakt, FAQ und andere Seiten verwalten
            </p>
          </div>
        </div>
        <Link href={ROUTES.admin.contentPageNew} className={buttonClass({ variant: 'primary' })}>
          <Plus className="w-5 h-5" />
          Neue Seite
        </Link>
      </div>

      {/* Half-wired warning: public pages (/about, /faq, /impressum,
          /datenschutz) currently render from hardcoded React components,
          not from this table. An admin who creates or edits an entry
          here will see it saved + counted in the stats above, but the
          content will NOT appear on the public site. Wiring the public
          /pages/[slug] route to read from static_pages is the proper
          fix — until then, this banner prevents wasted admin effort. */}
      <div className="rounded-xl border border-warning-200 dark:border-warning-800/40 bg-warning-50 dark:bg-warning-900/20 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-warning-700 dark:text-warning-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-warning-900 dark:text-warning-200 mb-1">
              Hinweis: Diese Seiten sind aktuell nicht öffentlich verknüpft
            </p>
            <p className="text-warning-800 dark:text-warning-300">
              Die öffentlichen Seiten (Über uns, FAQ, Impressum, Datenschutz)
              werden derzeit aus festen React-Komponenten gerendert, nicht aus
              dieser Datenbank. Hier gespeicherte Inhalte erscheinen nicht
              automatisch auf der öffentlichen Website. Die Anbindung wird in
              einem späteren Schritt nachgezogen.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle dark:border-white/6">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-action" />
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Gesamt Seiten
              </p>
              <p className="text-2xl font-bold text-text-primary">
                {stats.totalPages}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle dark:border-white/6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-action" />
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Veröffentlicht
              </p>
              <p className="text-2xl font-bold text-text-primary">
                {stats.publishedPages}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle dark:border-white/6">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-secondary-600" />
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Entwürfe
              </p>
              <p className="text-2xl font-bold text-text-primary">
                {stats.draftPages}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 overflow-hidden">
        {pages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-raised">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Seite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Aktualisiert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-base divide-y divide-neutral-200 dark:divide-white/4">
                {pages.map((page) => (
                  <tr
                    key={page.id}
                    className="hover:bg-surface-raised dark:hover:bg-surface-base/6"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-text-primary">
                        {page.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm text-text-secondary bg-surface-raised px-2 py-1 rounded-sm">
                        /{page.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          page.is_published
                            ? 'bg-action-muted text-action-muted'
                            : 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300'
                        }`}
                      >
                        {page.is_published ? 'Veröffentlicht' : 'Entwurf'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-primary">
                        {page.updated_at ? formatDateNumeric(page.updated_at) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${page.slug}`}
                          className="text-text-secondary hover:text-text-primary"
                          target="_blank"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={ROUTES.admin.contentPage(page.id)}
                          className="text-action hover:text-action"
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
            <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
              Noch keine Seiten
            </Heading>
            <p className="text-text-secondary mb-6">
              Erstelle statische Seiten wie Über uns, Kontakt oder FAQ.
            </p>
            <Link href={ROUTES.admin.contentPageNew} className={buttonClass({ variant: 'primary' })}>
              <Plus className="w-5 h-5" />
              Erste Seite erstellen
            </Link>
          </div>
        )}
      </div>

      {/* Common Pages Suggestion */}
      {pages.length === 0 && (
        <div className="bg-action-muted border border-strong rounded-xl p-6">
          <Heading level={3} className="font-medium text-action-text mb-3">
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
                href={`${ROUTES.admin.contentPageNew}?title=${encodeURIComponent(suggestion.title)}&slug=${suggestion.slug}`}
                className="flex items-center gap-2 p-3 bg-surface-base rounded-lg hover:bg-action-muted transition-colors"
              >
                <Plus className="w-4 h-4 text-action" />
                <span className="text-sm font-medium text-text-primary">
                  {suggestion.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-surface-raised border border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-surface-raised rounded-lg flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-text-secondary" />
          </div>
          <div>
            <Heading level={3} className="font-medium text-text-primary">
              Statische Seiten
            </Heading>
            <p className="text-sm text-text-secondary mt-1">
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
