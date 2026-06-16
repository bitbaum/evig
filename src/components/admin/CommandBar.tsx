'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import {
  Search,
  Monitor,
  Vote,
  FileText,
  LayoutDashboard,
  User,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ROUTES } from '@/config/routes'
import { adminInteractive } from '@/lib/admin-ui'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchSection {
  id: string
  label: string
  path: string
  description: string
}

interface SearchUser {
  id: string
  name: string
  email: string
}

interface SearchDecision {
  id: string
  title: string
  status: string
}

interface SearchListing {
  id: string
  title: string
  status: string
}

interface SearchIndex {
  sections: SearchSection[]
  recentUsers: SearchUser[]
  recentDecisions: SearchDecision[]
  recentListings: SearchListing[]
}

interface ResultItem {
  key: string
  label: string
  sub?: string
  href: string
  icon: React.ReactNode
  group: string
}

// ---------------------------------------------------------------------------
// Hardcoded action commands (always available)
// ---------------------------------------------------------------------------

const ACTION_COMMANDS: ResultItem[] = [
  {
    key: 'cmd-erfassung',
    label: 'Neues Gerät erfassen',
    href: ROUTES.admin.erfassungNew,
    icon: <Monitor className="w-4 h-4" />,
    group: 'Aktionen',
  },
  {
    key: 'cmd-decision',
    label: 'Neue Entscheidung',
    href: ROUTES.admin.decisionNew,
    icon: <Vote className="w-4 h-4" />,
    group: 'Aktionen',
  },
  {
    key: 'cmd-protocol',
    label: 'Neues Protokoll',
    href: ROUTES.admin.protocolNew,
    icon: <FileText className="w-4 h-4" />,
    group: 'Aktionen',
  },
  {
    key: 'cmd-dashboard',
    label: 'Dashboard',
    href: ROUTES.admin.dashboard,
    icon: <LayoutDashboard className="w-4 h-4" />,
    group: 'Aktionen',
  },
]

// ---------------------------------------------------------------------------
// Simple substring search (no extra dependency)
// ---------------------------------------------------------------------------

function matches(haystack: string, query: string): boolean {
  return haystack.toLowerCase().includes(query.toLowerCase())
}

function buildResults(index: SearchIndex | null, query: string): ResultItem[] {
  const q = query.trim()

  // No query → show only action commands
  if (!q) return ACTION_COMMANDS

  const items: ResultItem[] = []

  if (index) {
    // Sections
    for (const s of index.sections) {
      if (matches(s.label, q) || matches(s.description, q)) {
        items.push({
          key: `section-${s.id}`,
          label: s.label,
          sub: s.description,
          href: s.path,
          icon: <LayoutDashboard className="w-4 h-4" />,
          group: 'Bereiche',
        })
      }
    }

    // Users
    for (const u of index.recentUsers) {
      if (matches(u.name, q) || matches(u.email, q)) {
        items.push({
          key: `user-${u.id}`,
          label: u.name || u.email,
          sub: u.email,
          href: ROUTES.admin.user(u.id),
          icon: <User className="w-4 h-4" />,
          group: 'Benutzer',
        })
      }
    }

    // Decisions
    for (const d of index.recentDecisions) {
      if (matches(d.title, q)) {
        items.push({
          key: `decision-${d.id}`,
          label: d.title,
          sub: d.status,
          href: ROUTES.admin.decision(d.id),
          icon: <Vote className="w-4 h-4" />,
          group: 'Entscheide',
        })
      }
    }

    // Listings
    for (const l of index.recentListings) {
      if (matches(l.title, q)) {
        items.push({
          key: `listing-${l.id}`,
          label: l.title,
          sub: l.status,
          href: ROUTES.admin.listing(l.id),
          icon: <Monitor className="w-4 h-4" />,
          group: 'Inserate',
        })
      }
    }
  }

  // Also filter action commands
  const matchedActions = ACTION_COMMANDS.filter(a => matches(a.label, q))

  return [...matchedActions, ...items]
}

// ---------------------------------------------------------------------------
// CommandBar component
// ---------------------------------------------------------------------------

export function CommandBar() {
  const t = useTranslations('admin.commandBar')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<SearchIndex | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Fetch index once when first opened
  useEffect(() => {
    if (!open || index) return
    apiFetch<SearchIndex>('/api/admin/search-index').then(result => {
      if (result.success && result.data) setIndex(result.data)
    })
  }, [open, index])

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Dialog open/close
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      dialog.showModal()
      setQuery('')
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      dialog.close()
    }
  }, [open])

  const close = useCallback(() => setOpen(false), [])

  // Close on backdrop click
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handler = (e: MouseEvent) => {
      if (e.target === dialog) close()
    }
    dialog.addEventListener('click', handler)
    return () => dialog.removeEventListener('click', handler)
  }, [close])

  const results = useMemo(() => buildResults(index, query), [index, query])

  // Group results
  const groups = useMemo(() => {
    const map = new Map<string, ResultItem[]>()
    for (const item of results) {
      const g = map.get(item.group) ?? []
      g.push(item)
      map.set(item.group, g)
    }
    return map
  }, [results])

  // Navigate with arrow keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = results[activeIdx]
      if (item) {
        router.push(item.href)
        close()
      }
    } else if (e.key === 'Escape') {
      close()
    }
  }

  // Flat index for cursor tracking across groups
  let flatIdx = 0

  return (
    <>
      {/* Trigger button in top bar (Search icon) */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border border bg-surface-raised px-3 h-8 text-xs text-text-tertiary hover:bg-surface-overlay dark:bg-surface-base/4 dark:hover:bg-surface-base/8 sm:flex"
        aria-label="Suche öffnen (⌘K)"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="text-xs">Suche</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-surface-overlay rounded-sm text-xs font-mono leading-none">
          ⌘K
        </kbd>
      </Button>

      {/* Native dialog */}
      <dialog
        ref={dialogRef}
        className="w-full max-w-xl rounded-xl border border bg-surface-base p-0 shadow-xs backdrop:bg-black/60"
        onKeyDown={handleKeyDown}
        onClose={close}
        aria-label={t('openShortcut')}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border px-4 py-3">
          <Search className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
          <Input
            ref={inputRef}
            type="search"
            placeholder={t('placeholder')}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
            className="flex-1 bg-transparent border-0 focus:ring-0 focus-visible:ring-0 px-0"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="shrink-0 rounded-sm bg-surface-raised px-1.5 py-0.5 font-mono text-xs leading-none text-text-tertiary dark:bg-surface-base/6">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-96 py-2">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-text-muted">
              Keine Ergebnisse für &ldquo;{query}&rdquo;
            </p>
          ) : (
            Array.from(groups.entries()).map(([groupLabel, items]) => (
              <div key={groupLabel}>
                <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {groupLabel}
                </p>
                {items.map(item => {
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
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left h-auto rounded-none justify-start',
                        isCurrent
                          ? adminInteractive.pickerActive
                          : cn('text-text-secondary', adminInteractive.rowHoverSubtle),
                      )}
                    >
                      <span className={`shrink-0 ${isCurrent ? 'text-action' : 'text-text-muted'}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium text-sm leading-snug truncate">
                          {item.label}
                        </span>
                        {item.sub && (
                          <span className="block text-xs text-text-muted truncate mt-0.5">
                            {item.sub}
                          </span>
                        )}
                      </span>
                      {isCurrent && (
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-action" aria-hidden="true" />
                      )}
                    </Button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t border-subtle px-4 py-2 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <kbd className="rounded-sm bg-surface-raised px-1 py-0.5 font-mono dark:bg-surface-base/6">↑↓</kbd>
            Navigieren
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded-sm bg-surface-raised px-1 py-0.5 font-mono dark:bg-surface-base/6">↵</kbd>
            Öffnen
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded-sm bg-surface-raised px-1 py-0.5 font-mono dark:bg-surface-base/6">Esc</kbd>
            Schliessen
          </span>
        </div>
      </dialog>
    </>
  )
}
