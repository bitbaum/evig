/**
 * Admin Presentations Page
 *
 * Lists the static presentation decks (SSOT: src/config/presentations.ts)
 * so staff can open them and copy shareable links. Decks are unlisted:
 * public per link (no account needed), noindex for search engines —
 * see the rewrite + header rules in next.config.js.
 */

import { Metadata } from 'next'
import { Info, Presentation } from 'lucide-react'
import { requireAnySection } from '@/lib/admin/guards'
import { PRESENTATION_DECKS } from '@/config/presentations'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { PresentationsBrowser } from './PresentationsBrowser'

export const metadata: Metadata = {
  title: 'Präsentationen',
  description: 'Präsentationen ansehen und teilen',
}

export default async function PresentationsPage() {
  // Accessible with either the dedicated 'presentations' permission (sidebar
  // key) or the broader 'content' permission (presentations are content).
  await requireAnySection(['presentations', 'content'], 'presentations')

  return (
    <AdminPageWrapper
      title="Präsentationen"
      description={`${PRESENTATION_DECKS.length} Präsentationen ansehen und teilen`}
      icon={Presentation}
      iconColor="blue"
    >
      {/* Sharing note — decks are unlisted, not private */}
      <div className="flex items-start gap-2 bg-surface-raised rounded-xl border border px-4 py-3">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-text-muted" aria-hidden="true" />
        <p className="text-sm text-text-secondary">
          Öffentlich per Link teilbar — Empfänger brauchen KEIN Konto. Für
          Suchmaschinen unsichtbar (noindex).
        </p>
      </div>

      <PresentationsBrowser decks={PRESENTATION_DECKS} />
    </AdminPageWrapper>
  )
}
