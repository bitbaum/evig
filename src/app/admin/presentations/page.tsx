/**
 * Admin Presentations Page
 *
 * Lists the static presentation decks (SSOT: src/config/presentations.ts)
 * so staff can open them and copy shareable links. Decks are unlisted:
 * public per link (no account needed), noindex for search engines —
 * see the rewrite + header rules in next.config.js.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { Info, Presentation, MessageSquare } from 'lucide-react'
import { eq, count } from 'drizzle-orm'
import { db } from '@/db'
import { presentationComments } from '@/db/schema'
import { requireAnySection } from '@/lib/admin/guards'
import { PRESENTATION_DECKS } from '@/config/presentations'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { PresentationsBrowser } from './PresentationsBrowser'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Präsentationen',
  description: 'Präsentationen ansehen und teilen',
}

export default async function PresentationsPage() {
  // Accessible with either the dedicated 'presentations' permission (sidebar
  // key) or the broader 'content' permission (presentations are content).
  await requireAnySection(['presentations', 'content'], 'presentations')

  const [open] = await db
    .select({ n: count() })
    .from(presentationComments)
    .where(eq(presentationComments.resolved, false))
  const openFeedback = Number(open?.n ?? 0)

  return (
    <AdminPageWrapper
      title="Präsentationen"
      description={`${PRESENTATION_DECKS.length} Präsentationen ansehen und teilen`}
      icon={Presentation}
      iconColor="blue"
    >
      {/* Sharing note — decks are unlisted, not private */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-2 bg-surface-raised rounded-xl border border px-4 py-3 flex-1">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-text-muted" aria-hidden="true" />
          <p className="text-sm text-text-secondary">
            Öffentlich per Link teilbar — Empfänger brauchen KEIN Konto. Leser:innen
            können pro Folie kommentieren; Suchmaschinen sehen die Decks nicht (noindex).
          </p>
        </div>
        <Link
          href="/admin/presentations/feedback"
          className="inline-flex items-center gap-2 shrink-0 rounded-xl border border bg-surface-base px-4 py-3 text-sm font-medium text-text-primary hover:border-strong transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-text-muted" aria-hidden="true" />
          Feedback
          {openFeedback > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-action text-white text-xs font-semibold">
              {openFeedback}
            </span>
          )}
        </Link>
      </div>

      <PresentationsBrowser decks={PRESENTATION_DECKS} />
    </AdminPageWrapper>
  )
}
