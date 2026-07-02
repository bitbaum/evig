/**
 * Admin Presentations Page
 *
 * Lists the static presentation decks (SSOT: src/config/presentations.ts)
 * so staff can open them and copy shareable links. Decks are unlisted:
 * public per link (no account needed), noindex for search engines —
 * see the rewrite + header rules in next.config.js.
 */

import { Metadata } from 'next'
import { ExternalLink, Info, Presentation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requireAnySection } from '@/lib/admin/guards'
import { PRESENTATION_DECKS, presentationUrl } from '@/config/presentations'
import { formatDateMonth } from '@/lib/date-formats'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import Heading from '@/components/admin/AdminHeading'
import { CopyLinkButton } from './CopyLinkButton'

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRESENTATION_DECKS.map(deck => (
          <div
            key={deck.slug}
            className="flex flex-col bg-surface-base rounded-xl border border p-5 hover:border-strong transition-colors"
          >
            <Heading level={3} className="text-base text-text-primary mb-1">
              {deck.title}
            </Heading>
            <p className="text-sm text-text-secondary mb-3">{deck.description}</p>

            <div className="flex items-center gap-2 mb-4 mt-auto">
              <span className="inline-flex items-center px-2 py-0.5 bg-surface-raised text-text-secondary rounded-full text-xs font-medium">
                {deck.audience}
              </span>
              <span className="text-xs text-text-muted">
                {formatDateMonth(`${deck.createdMonth}-01`)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                href={presentationUrl(deck.slug)}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="sm"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                Öffnen
              </Button>
              <CopyLinkButton slug={deck.slug} />
            </div>
          </div>
        ))}
      </div>
    </AdminPageWrapper>
  )
}
