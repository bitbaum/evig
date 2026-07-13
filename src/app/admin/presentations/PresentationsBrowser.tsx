'use client'

/**
 * Client-side browser for the presentation decks: live text search, sort
 * (Datum / Titel) and audience filter over the SSOT list. Kept in a client
 * component so the server page stays a thin auth + data-passing shell.
 */

import { useMemo, useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatDateMonth } from '@/lib/date-formats'
import { presentationUrl, type PresentationDeck } from '@/config/presentations'
import { CopyLinkButton } from './CopyLinkButton'

type SortKey = 'date' | 'title'

export function PresentationsBrowser({ decks }: { decks: PresentationDeck[] }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('date')
  const [audience, setAudience] = useState('all')

  // Audience options derive from the data — no hardcoded list to drift.
  const audiences = useMemo(
    () => Array.from(new Set(decks.map(d => d.audience))).sort((a, b) => a.localeCompare(b, 'de')),
    [decks]
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return decks
      .filter(d => audience === 'all' || d.audience === audience)
      .filter(d =>
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.audience.toLowerCase().includes(q)
      )
      .sort((a, b) =>
        sort === 'title'
          ? a.title.localeCompare(b.title, 'de')
          : b.createdMonth.localeCompare(a.createdMonth) || a.title.localeCompare(b.title, 'de')
      )
  }, [decks, query, sort, audience])

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Präsentation suchen …"
            aria-label="Präsentationen durchsuchen"
            className="pl-9"
          />
        </div>
        <Select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          aria-label="Sortieren"
          className="sm:w-44"
        >
          <option value="date">Neueste zuerst</option>
          <option value="title">Titel A–Z</option>
        </Select>
        <Select
          value={audience}
          onChange={e => setAudience(e.target.value)}
          aria-label="Nach Publikum filtern"
          className="sm:w-44"
        >
          <option value="all">Alle Publika</option>
          {audiences.map(a => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      </div>

      <p className="text-xs text-text-muted" aria-live="polite">
        {visible.length === decks.length
          ? `${decks.length} Präsentationen`
          : `${visible.length} von ${decks.length} Präsentationen`}
      </p>

      {visible.length === 0 ? (
        <div className="rounded-xl border border px-4 py-12 text-center text-sm text-text-secondary">
          Keine Präsentation gefunden. Suchbegriff oder Filter anpassen.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(deck => (
            <div
              key={deck.slug}
              className="flex flex-col bg-surface-base rounded-xl border border p-5 hover:border-strong transition-colors"
            >
              <h3 className="text-base font-semibold text-text-primary mb-1">{deck.title}</h3>
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
      )}
    </div>
  )
}
