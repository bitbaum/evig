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
  Globe,
  AlertTriangle,
} from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsGrid, type StatCardItem } from '@/components/admin/AdminStatsGrid'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { AdminButton } from '@/components/admin/AdminButton'
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

// Half-wired warning: public pages (/about, /faq, /impressum, /datenschutz)
// currently render from hardcoded React components, not from this table. An
// admin who creates/edits an entry here sees it saved + counted, but the
// content will NOT appear on the public site until the public /pages/[slug]
// route reads from static_pages. This banner prevents wasted admin effort.
function HalfWiredWarning() {
  return (
    <div className="rounded-lg border border-warning-200 dark:border-warning-800/40 bg-warning-50 dark:bg-warning-900/20 p-4">
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-warning-700 dark:text-warning-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-warning-900 dark:text-warning-200 mb-1">
            Hinweis: Diese Seiten sind aktuell nicht öffentlich verknüpft
          </p>
          <p className="text-warning-800 dark:text-warning-300">
            Die öffentlichen Seiten (Über uns, FAQ, Impressum, Datenschutz) werden derzeit aus festen
            React-Komponenten gerendert, nicht aus dieser Datenbank. Hier gespeicherte Inhalte erscheinen
            nicht automatisch auf der öffentlichen Website. Die Anbindung wird in einem späteren Schritt nachgezogen.
          </p>
        </div>
      </div>
    </div>
  )
}

const SUGGESTED_PAGES = [
  { title: 'Über uns', slug: 'ueber-uns' },
  { title: 'Kontakt', slug: 'kontakt' },
  { title: 'FAQ', slug: 'faq' },
  { title: 'Datenschutz', slug: 'datenschutz' },
  { title: 'Impressum', slug: 'impressum' },
  { title: 'AGB', slug: 'agb' },
  { title: 'Team', slug: 'team' },
  { title: 'Partner', slug: 'partner' },
] as const

export default async function AdminPagesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/content/pages')
  }

  const [stats, pages] = await Promise.all([getPageStats(), getStaticPages()])

  const createAction = (
    <AdminButton href={ROUTES.admin.contentPageNew} variant="primary" className="gap-2">
      <Plus className="w-4 h-4" />
      Neue Seite
    </AdminButton>
  )

  // No pages yet → warning + a "recommended pages" quick-create grid as the
  // empty state (no dead stats grid).
  if (pages.length === 0) {
    return (
      <AdminPageWrapper
        title="Statische Seiten"
        description="Über uns, Kontakt, FAQ und andere Seiten verwalten"
        icon={FileText}
        backButton={{ href: ROUTES.admin.content, label: 'Inhalte' }}
        actions={createAction}
      >
        <HalfWiredWarning />
        <div className="rounded-lg border border-default bg-surface-base p-8">
          <Heading level={3} className="font-medium text-text-primary mb-1">Noch keine Seiten</Heading>
          <p className="text-text-secondary mb-4">Erstelle eine der empfohlenen Seiten:</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {SUGGESTED_PAGES.map((s) => (
              <Link
                key={s.slug}
                href={`${ROUTES.admin.contentPageNew}?title=${encodeURIComponent(s.title)}&slug=${s.slug}`}
                className="flex items-center gap-2 p-3 bg-surface-raised rounded-lg hover:bg-action-muted transition-colors"
              >
                <Plus className="w-4 h-4 text-action" />
                <span className="text-sm font-medium text-text-primary">{s.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </AdminPageWrapper>
    )
  }

  const statCards: StatCardItem[] = [
    { icon: Globe, color: 'gray', label: 'Gesamt Seiten', value: stats.totalPages },
    { icon: CheckCircle, color: 'green', label: 'Veröffentlicht', value: stats.publishedPages },
    { icon: Clock, color: 'gray', label: 'Entwürfe', value: stats.draftPages },
  ]

  const columns: AdminTableColumn<StaticPage>[] = [
    { header: 'Seite', cell: (p) => <span className="text-sm font-medium text-text-primary">{p.title}</span> },
    {
      header: 'URL',
      className: 'whitespace-nowrap',
      cell: (p) => <code className="text-sm text-text-secondary bg-surface-raised px-2 py-1 rounded-sm">/{p.slug}</code>,
    },
    {
      header: 'Status',
      className: 'whitespace-nowrap',
      cell: (p) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          p.is_published
            ? 'bg-action-muted text-action'
            : 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300'
        }`}>
          {p.is_published ? 'Veröffentlicht' : 'Entwurf'}
        </span>
      ),
    },
    {
      header: 'Aktualisiert',
      className: 'whitespace-nowrap',
      cell: (p) => <span className="text-sm text-text-primary">{p.updated_at ? formatDateNumeric(p.updated_at) : '-'}</span>,
    },
    {
      header: 'Aktionen',
      className: 'whitespace-nowrap',
      cell: (p) => (
        <div className="flex items-center gap-2">
          <Link href={`/${p.slug}`} className="text-text-secondary hover:text-text-primary" target="_blank">
            <Eye className="w-4 h-4" />
          </Link>
          <Link href={ROUTES.admin.contentPage(p.id)} className="text-action hover:text-action">
            <Edit className="w-4 h-4" />
          </Link>
        </div>
      ),
    },
  ]

  return (
    <AdminPageWrapper
      title="Statische Seiten"
      description="Über uns, Kontakt, FAQ und andere Seiten verwalten"
      icon={FileText}
      backButton={{ href: ROUTES.admin.content, label: 'Inhalte' }}
      actions={createAction}
    >
      <HalfWiredWarning />
      <AdminStatsGrid items={statCards} columns={3} />
      <AdminTable columns={columns} rows={pages} rowKey={(p) => p.id} />
    </AdminPageWrapper>
  )
}
