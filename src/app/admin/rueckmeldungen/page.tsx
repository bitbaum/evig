/**
 * Admin: Rückmeldungen — one place for ALL feedback.
 *
 * Read-only aggregation of the three feedback stores (they stay separate at the
 * write layer; this is the single pane to see everything):
 *   - Website     → site_suggestions        (detail: /admin/feedback)
 *   - Präsentation → presentation_comments   (detail: /admin/presentations/feedback)
 *   - Liefergegenstand → deliverable_feedback (detail: /admin/deliverables/[id])
 * Each source is fetched defensively so one missing table never breaks the page.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { Inbox } from 'lucide-react'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { siteSuggestions, presentationComments, deliverableFeedback, deliverables, users } from '@/db/schema'
import { requireAnySection } from '@/lib/admin/guards'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid'
import { FEEDBACK_KIND_LABELS, type FeedbackKind } from '@/config/deliverables'
import { formatDateTimeNumeric } from '@/lib/date-formats'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Rückmeldungen',
  description: 'Alle Rückmeldungen an einem Ort.',
}

type Source = 'website' | 'presentation' | 'deliverable'

interface Item {
  key: string
  source: Source
  kindLabel: string
  summary: string
  context: string
  author: string | null
  createdAt: string
  open: boolean
  href: string
}

const SOURCE_META: Record<Source, { label: string; cls: string }> = {
  website: { label: 'Website', cls: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-200' },
  presentation: { label: 'Präsentation', cls: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-200' },
  deliverable: { label: 'Liefergegenstand', cls: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300' },
}

function snippet(s: string, n = 160): string {
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s
}

async function fetchAll(): Promise<Item[]> {
  const items: Item[] = []

  // Website feedback
  try {
    const rows = await db
      .select({
        id: siteSuggestions.id,
        body: siteSuggestions.suggestion,
        contact: siteSuggestions.contact,
        pageTitle: siteSuggestions.pageTitle,
        page: siteSuggestions.page,
        resolved: siteSuggestions.resolved,
        createdAt: siteSuggestions.createdAt,
      })
      .from(siteSuggestions)
      .orderBy(desc(siteSuggestions.createdAt))
      .limit(200)
    for (const r of rows) {
      items.push({
        key: `w-${r.id}`,
        source: 'website',
        kindLabel: 'Feedback',
        summary: snippet(r.body),
        context: r.pageTitle || r.page || 'Website',
        author: r.contact,
        createdAt: r.createdAt ?? '',
        open: !r.resolved,
        href: '/admin/feedback',
      })
    }
  } catch (error) {
    logger.warn('Rückmeldungen: website source failed', { error })
  }

  // Presentation slide comments
  try {
    const rows = await db
      .select({
        id: presentationComments.id,
        deckSlug: presentationComments.deckSlug,
        slideIndex: presentationComments.slideIndex,
        slideTitle: presentationComments.slideTitle,
        body: presentationComments.body,
        authorName: presentationComments.authorName,
        resolved: presentationComments.resolved,
        createdAt: presentationComments.createdAt,
      })
      .from(presentationComments)
      .orderBy(desc(presentationComments.createdAt))
      .limit(200)
    for (const r of rows) {
      const ctx = `${r.deckSlug} · Folie ${r.slideIndex + 1}${r.slideTitle ? ` · ${r.slideTitle}` : ''}`
      items.push({
        key: `p-${r.id}`,
        source: 'presentation',
        kindLabel: 'Kommentar',
        summary: snippet(r.body),
        context: ctx,
        author: r.authorName,
        createdAt: r.createdAt ?? '',
        open: !r.resolved,
        href: '/admin/presentations/feedback',
      })
    }
  } catch (error) {
    logger.warn('Rückmeldungen: presentation source failed', { error })
  }

  // Deliverable feedback
  try {
    const rows = await db
      .select({
        id: deliverableFeedback.id,
        body: deliverableFeedback.body,
        kind: deliverableFeedback.kind,
        status: deliverableFeedback.status,
        authorName: deliverableFeedback.authorName,
        userName: users.name,
        dId: deliverables.id,
        dTitle: deliverables.title,
        createdAt: deliverableFeedback.createdAt,
      })
      .from(deliverableFeedback)
      .leftJoin(deliverables, eq(deliverableFeedback.deliverableId, deliverables.id))
      .leftJoin(users, eq(deliverableFeedback.authorUserId, users.id))
      .orderBy(desc(deliverableFeedback.createdAt))
      .limit(200)
    for (const r of rows) {
      items.push({
        key: `d-${r.id}`,
        source: 'deliverable',
        kindLabel: FEEDBACK_KIND_LABELS[r.kind as FeedbackKind] ?? r.kind,
        summary: snippet(r.body),
        context: r.dTitle ?? 'Liefergegenstand',
        author: r.userName ?? r.authorName,
        createdAt: r.createdAt ?? '',
        open: r.status === 'open',
        href: r.dId ? `/admin/deliverables/${r.dId}` : '/admin/deliverables',
      })
    }
  } catch (error) {
    logger.warn('Rückmeldungen: deliverable source failed', { error })
  }

  // Newest first (ISO timestamps sort lexicographically)
  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'website', label: 'Website' },
  { key: 'presentation', label: 'Präsentationen' },
  { key: 'deliverable', label: 'Liefergegenstände' },
]

export default async function RueckmeldungenPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; open?: string }>
}) {
  await requireAnySection(['feedbackOverview'], 'rueckmeldungen')
  const params = await searchParams
  const all = await fetchAll()

  const openCount = all.filter((i) => i.open).length
  const perSource = (s: Source) => all.filter((i) => i.source === s).length

  const activeSource = params.source && params.source !== 'all' ? params.source : 'all'
  const openOnly = params.open === '1'
  let rows = all
  if (activeSource !== 'all') rows = rows.filter((i) => i.source === activeSource)
  if (openOnly) rows = rows.filter((i) => i.open)

  const qs = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams()
    const source = patch.source ?? activeSource
    const open = 'open' in patch ? patch.open : openOnly ? '1' : undefined
    if (source && source !== 'all') sp.set('source', source)
    if (open) sp.set('open', '1')
    const s = sp.toString()
    return s ? `?${s}` : ''
  }

  return (
    <AdminPageWrapper
      title="Rückmeldungen"
      description="Alle Rückmeldungen an einem Ort — Website, Präsentationen und Liefergegenstände."
      icon={Inbox}
      iconColor="blue"
    >
      <AdminStatsGrid
        items={[
          { icon: Inbox, color: 'gray', label: 'Gesamt', value: all.length },
          { icon: Inbox, color: 'amber', label: 'Offen', value: openCount },
          { icon: Inbox, color: 'blue', label: 'Website', value: perSource('website') },
          { icon: Inbox, color: 'green', label: 'Liefergegenstände', value: perSource('deliverable') },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2 my-4">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/rueckmeldungen${qs({ source: f.key })}`}
            className={`text-sm rounded-full px-3 py-1.5 border transition-colors ${
              activeSource === f.key ? 'bg-primary-700 text-white border-primary-700' : 'text-text-secondary hover:text-action'
            }`}
          >
            {f.label}
          </Link>
        ))}
        <span className="mx-1 text-border">|</span>
        <Link
          href={`/admin/rueckmeldungen${qs({ open: openOnly ? undefined : '1' })}`}
          className={`text-sm rounded-full px-3 py-1.5 border transition-colors ${
            openOnly ? 'bg-primary-700 text-white border-primary-700' : 'text-text-secondary hover:text-action'
          }`}
        >
          Nur offene
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="bg-surface-base rounded-lg border p-10 text-center">
          <Inbox className="w-10 h-10 mx-auto text-text-secondary mb-3" />
          <p className="text-text-primary font-medium">Keine Rückmeldungen</p>
          <p className="text-text-secondary text-sm mt-1">Hier erscheinen Rückmeldungen aus allen drei Quellen.</p>
        </div>
      ) : (
        <div className="bg-surface-base rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-surface-raised text-text-secondary text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Quelle</th>
                  <th className="px-4 py-3 font-medium">Rückmeldung</th>
                  <th className="px-4 py-3 font-medium">Kontext</th>
                  <th className="px-4 py-3 font-medium">Von</th>
                  <th className="px-4 py-3 font-medium">Datum</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((i) => (
                  <tr key={i.key} className="hover:bg-surface-raised transition-colors align-top">
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${SOURCE_META[i.source].cls}`}>
                        {SOURCE_META[i.source].label}
                      </span>
                      <div className="text-xs text-text-secondary mt-1">{i.kindLabel}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={i.href} className="text-text-primary hover:text-action">{i.summary}</Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{i.context}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{i.author ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{i.createdAt ? formatDateTimeNumeric(i.createdAt) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        i.open ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-200' : 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                      }`}>
                        {i.open ? 'Offen' : 'Erledigt'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  )
}
