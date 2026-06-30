'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from '@/i18n/navigation'
import {
  Search, ChevronRight, Package, ShoppingBag, Heart, Store, GraduationCap, ArrowRight, Compass,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api/client'
import { getDashboardSections } from '@/config/sections'

/**
 * Site-wide command palette for logged-in users (⌘K / tap). Mounted once in the
 * global Header, so it's available on the dashboard, marketplace and public
 * pages (admin has its own palette). Searches the user's own listings/orders/
 * favorites + public marketplace listings + workshops, and jumps to any
 * dashboard destination — plus a "search the marketplace for X" hand-off.
 */
/** Triggers dispatch this to open the single mounted palette dialog. */
export const OPEN_COMMAND_PALETTE_EVENT = 'revampit:open-command-palette'
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))
}

interface IdTitleStatus { id: string; title: string; status?: string }
interface SearchIndex {
  myListings: IdTitleStatus[]
  myOrders: IdTitleStatus[]
  favorites: { id: string; title: string }[]
  marketplace: { id: string; title: string; price_chf?: string | number }[]
  workshops: { id: string; slug?: string; title: string }[]
}

interface ResultItem {
  key: string
  label: string
  sub?: string
  href: string
  icon: ReactNode
  group: string
}

function norm(s: string) {
  return s.toLowerCase().trim()
}

function buildResults(index: SearchIndex | null, query: string): ResultItem[] {
  const q = norm(query)
  const items: ResultItem[] = []

  // Navigation destinations (always available, filtered by query).
  for (const s of getDashboardSections()) {
    if (q && !norm(s.ui.label).includes(q)) continue
    items.push({
      key: `nav:${s.id}`, label: s.ui.label, href: s.path, group: 'Gehe zu',
      icon: <Compass className="h-4 w-4" />,
    })
  }
  // Cap nav results when no query so data results show.
  const navItems = q ? items : items.slice(0, 4)
  const out = [...navItems]

  if (!index) return out

  const matches = (t: string) => !q || norm(t).includes(q)

  for (const l of index.myListings) {
    if (!matches(l.title)) continue
    out.push({ key: `ml:${l.id}`, label: l.title, sub: l.status, href: `/marketplace/${l.id}`, group: 'Meine Inserate', icon: <Package className="h-4 w-4" /> })
  }
  for (const o of index.myOrders) {
    if (!matches(o.title)) continue
    out.push({ key: `mo:${o.id}`, label: o.title, sub: o.status, href: `/dashboard/orders/${o.id}`, group: 'Meine Bestellungen', icon: <ShoppingBag className="h-4 w-4" /> })
  }
  for (const f of index.favorites) {
    if (!matches(f.title)) continue
    out.push({ key: `fav:${f.id}`, label: f.title, href: `/marketplace/${f.id}`, group: 'Favoriten', icon: <Heart className="h-4 w-4" /> })
  }
  for (const m of index.marketplace) {
    if (!matches(m.title)) continue
    out.push({ key: `mk:${m.id}`, label: m.title, sub: m.price_chf != null ? `CHF ${m.price_chf}` : undefined, href: `/marketplace/${m.id}`, group: 'Marktplatz', icon: <Store className="h-4 w-4" /> })
  }
  for (const w of index.workshops) {
    if (!matches(w.title)) continue
    out.push({ key: `ws:${w.id}`, label: w.title, href: `/workshops/${w.slug ?? w.id}`, group: 'Workshops', icon: <GraduationCap className="h-4 w-4" /> })
  }

  // Hand-off: full marketplace search for the typed query.
  if (q) {
    out.push({ key: 'mk-search', label: `Im Marktplatz suchen: „${query.trim()}“`, href: `/marketplace?search=${encodeURIComponent(query.trim())}`, group: 'Suche', icon: <ArrowRight className="h-4 w-4" /> })
  }
  return out
}

export function UserCommandPalette() {
  const { status } = useSession()
  const loggedIn = status === 'authenticated'
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<SearchIndex | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open || index || !loggedIn) return
    apiFetch<SearchIndex>('/api/search-index').then(r => {
      if (r.success && r.data) setIndex(r.data)
    })
  }, [open, index, loggedIn])

  useEffect(() => {
    if (!loggedIn) return
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(p => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [loggedIn])

  // Triggers (placed anywhere — desktop + mobile header) open the single dialog
  // via this event, so we never double-mount the dialog or the ⌘K listener.
  useEffect(() => {
    if (!loggedIn) return
    const open = () => setOpen(true)
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, open)
    return () => window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, open)
  }, [loggedIn])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      dialog.showModal()
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on open
      setQuery('')
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      dialog.close()
    }
  }, [open])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handler = (e: MouseEvent) => { if (e.target === dialog) close() }
    dialog.addEventListener('click', handler)
    return () => dialog.removeEventListener('click', handler)
  }, [close])

  const results = useMemo(() => buildResults(index, query), [index, query])
  const groups = useMemo(() => {
    const map = new Map<string, ResultItem[]>()
    for (const item of results) {
      const g = map.get(item.group) ?? []
      g.push(item)
      map.set(item.group, g)
    }
    return map
  }, [results])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      const item = results[activeIdx]
      if (item) { router.push(item.href); close() }
    } else if (e.key === 'Escape') { close() }
  }

  if (!loggedIn) return null

  let flatIdx = 0

  // Dialog only — triggers live separately (CommandPaletteTrigger) so the bar can
  // place them in both the desktop and mobile header without double-mounting.
  return (
    <>
      <dialog
        ref={dialogRef}
        className="w-full max-w-xl rounded-xl border border bg-surface-base p-0 shadow-xs backdrop:bg-black/60"
        onKeyDown={handleKeyDown}
        onClose={close}
        aria-label="Befehlspalette"
      >
        <div className="flex items-center gap-3 border-b border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Suche Inserate, Bestellungen, Workshops…"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
            className="flex-1 border-0 bg-transparent px-0 focus:ring-0 focus-visible:ring-0"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="shrink-0 rounded-sm bg-surface-raised px-1.5 py-0.5 font-mono text-xs leading-none text-text-tertiary">Esc</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-text-muted">
              {query ? `Keine Ergebnisse für „${query}“` : 'Tippe, um zu suchen…'}
            </p>
          ) : (
            Array.from(groups.entries()).map(([groupLabel, gItems]) => (
              <div key={groupLabel}>
                <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">{groupLabel}</p>
                {gItems.map(item => {
                  const isCurrent = flatIdx === activeIdx
                  const currentFlatIdx = flatIdx
                  flatIdx++
                  return (
                    <Button
                      key={item.key}
                      variant="ghost"
                      onClick={() => { router.push(item.href); close() }}
                      onMouseEnter={() => setActiveIdx(currentFlatIdx)}
                      className={cn(
                        'flex h-auto w-full items-center justify-start gap-3 rounded-none px-4 py-2.5 text-left',
                        isCurrent ? 'bg-action-muted text-action' : 'text-text-secondary hover:bg-surface-raised',
                      )}
                    >
                      <span className={`shrink-0 ${isCurrent ? 'text-action' : 'text-text-muted'}`}>{item.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium leading-snug">{item.label}</span>
                        {item.sub && <span className="mt-0.5 block truncate text-xs text-text-muted">{item.sub}</span>}
                      </span>
                      {isCurrent && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-action" aria-hidden="true" />}
                    </Button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </dialog>
    </>
  )
}
