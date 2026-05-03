'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
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
    href: '/admin/erfassung/new',
    icon: <Monitor className="w-4 h-4" />,
    group: 'Aktionen',
  },
  {
    key: 'cmd-decision',
    label: 'Neue Entscheidung',
    href: '/admin/decisions/new',
    icon: <Vote className="w-4 h-4" />,
    group: 'Aktionen',
  },
  {
    key: 'cmd-protocol',
    label: 'Neues Protokoll',
    href: '/admin/protocols/new',
    icon: <FileText className="w-4 h-4" />,
    group: 'Aktionen',
  },
  {
    key: 'cmd-dashboard',
    label: 'Dashboard',
    href: '/admin',
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
          href: `/admin/users/${u.id}`,
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
          href: `/admin/decisions/${d.id}`,
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
          href: `/admin/marketplace/${l.id}`,
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
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 h-8 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg text-sm text-neutral-500 dark:text-neutral-400 transition-colors"
        aria-label="Suche öffnen (⌘K)"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="text-xs">Suche</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-600 rounded text-xs font-mono leading-none">
          ⌘K
        </kbd>
      </button>

      {/* Native dialog */}
      <dialog
        ref={dialogRef}
        className="w-full max-w-xl rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-0 backdrop:bg-black/40"
        onKeyDown={handleKeyDown}
        onClose={close}
        aria-label="Befehlspalette"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Suche oder Befehl..."
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
            className="flex-1 bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="flex-shrink-0 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded text-xs font-mono text-neutral-500 dark:text-neutral-400 leading-none">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-96 py-2">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
              Keine Ergebnisse für &ldquo;{query}&rdquo;
            </p>
          ) : (
            Array.from(groups.entries()).map(([groupLabel, items]) => (
              <div key={groupLabel}>
                <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  {groupLabel}
                </p>
                {items.map(item => {
                  const isCurrent = flatIdx === activeIdx
                  const currentFlatIdx = flatIdx
                  flatIdx++
                  return (
                    <button
                      key={item.key}
                      onClick={() => { router.push(item.href); close() }}
                      onMouseEnter={() => setActiveIdx(currentFlatIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isCurrent
                          ? 'bg-info-50 dark:bg-info-900/20 text-info-700 dark:text-info-300'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                      }`}
                    >
                      <span className={`flex-shrink-0 ${isCurrent ? 'text-info-500' : 'text-neutral-400 dark:text-neutral-500'}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium text-sm leading-snug truncate">
                          {item.label}
                        </span>
                        {item.sub && (
                          <span className="block text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                            {item.sub}
                          </span>
                        )}
                      </span>
                      {isCurrent && (
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-info-400" aria-hidden="true" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-neutral-100 dark:border-neutral-700 text-xs text-neutral-400 dark:text-neutral-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded font-mono">↑↓</kbd>
            Navigieren
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded font-mono">↵</kbd>
            Öffnen
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded font-mono">Esc</kbd>
            Schliessen
          </span>
        </div>
      </dialog>
    </>
  )
}
