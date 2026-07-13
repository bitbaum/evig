'use client'

import { useMemo, useState, useTransition } from 'react'
import { Copy, Check, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setCommentResolved } from './actions'

type Comment = {
  id: string
  deckSlug: string
  slideIndex: number
  slideTitle: string | null
  body: string
  authorName: string | null
  authorUserId: string | null
  isStaff: boolean
  resolved: boolean
  createdAt: string | null
}

type Deck = { slug: string; title: string }

function authorLabel(c: Comment): string {
  if (c.authorName) return c.authorName
  return c.authorUserId ? 'Angemeldet' : 'Anonym'
}

export function FeedbackList({ comments, decks }: { comments: Comment[]; decks: Deck[] }) {
  const [showResolved, setShowResolved] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const titleFor = useMemo(() => {
    const m = new Map(decks.map(d => [d.slug, d.title]))
    return (slug: string) => m.get(slug) ?? slug
  }, [decks])

  // Group by deck (only decks that have comments), then sort by slide.
  const groups = useMemo(() => {
    const byDeck = new Map<string, Comment[]>()
    for (const c of comments) {
      if (!showResolved && c.resolved) continue
      if (!byDeck.has(c.deckSlug)) byDeck.set(c.deckSlug, [])
      byDeck.get(c.deckSlug)!.push(c)
    }
    for (const list of byDeck.values()) {
      list.sort((a, b) => a.slideIndex - b.slideIndex || (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))
    }
    return [...byDeck.entries()]
  }, [comments, showResolved])

  function copyPrompt(slug: string, list: Comment[]) {
    const actionable = list.filter(c => !c.resolved)
    const use = actionable.length ? actionable : list
    const lines = [`Feedback zur Präsentation «${titleFor(slug)}» (/presentations/${slug}):`, '']
    for (const c of use) {
      lines.push(`— Folie ${c.slideIndex + 1}${c.slideTitle ? ` (${c.slideTitle})` : ''}: ${c.body.trim()}  [${authorLabel(c)}]`)
    }
    const text = lines.join('\n')
    const done = () => { setCopied(slug); setTimeout(() => setCopied(null), 1800) }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(done)
    else done()
  }

  const total = comments.length
  const openCount = comments.filter(c => !c.resolved).length

  if (total === 0) {
    return (
      <div className="rounded-xl border border px-4 py-12 text-center text-sm text-text-secondary">
        <MessageSquare className="w-6 h-6 mx-auto mb-2 text-text-muted" aria-hidden="true" />
        Noch keine Kommentare. Sobald jemand eine Folie kommentiert, erscheint es hier.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} />
        Erledigte anzeigen ({total - openCount} erledigt · {openCount} offen)
      </label>

      {groups.length === 0 ? (
        <div className="rounded-xl border border px-4 py-10 text-center text-sm text-text-secondary">
          Alle Kommentare erledigt. 🎉
        </div>
      ) : (
        groups.map(([slug, list]) => (
          <section key={slug} className="rounded-xl border border bg-surface-base overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border bg-surface-raised">
              <h3 className="text-sm font-semibold text-text-primary">
                {titleFor(slug)}
                <span className="ml-2 text-xs font-normal text-text-muted">
                  {list.filter(c => !c.resolved).length} offen
                </span>
              </h3>
              <Button variant="outline" size="sm" onClick={() => copyPrompt(slug, list)}>
                {copied === slug ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === slug ? 'Kopiert' : 'Als Prompt kopieren'}
              </Button>
            </div>

            <ul className="divide-y divide-[color:var(--border-default)]">
              {list.map(c => (
                <li key={c.id} className={`px-4 py-3 flex gap-3 ${c.resolved ? 'opacity-55' : ''}`}>
                  <span className="shrink-0 mt-0.5 inline-flex items-center justify-center min-w-14 h-6 px-2 rounded-md bg-surface-raised text-xs font-mono text-text-secondary">
                    Folie {c.slideIndex + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    {c.slideTitle && <div className="text-xs text-text-muted mb-0.5 truncate">{c.slideTitle}</div>}
                    <p className="text-sm text-text-primary whitespace-pre-wrap break-words">{c.body}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
                      <span>{authorLabel(c)}</span>
                      {c.isStaff && <span className="px-1.5 py-0.5 rounded bg-surface-raised text-text-secondary">Team</span>}
                      {c.createdAt && <span>· {new Date(c.createdAt).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => startTransition(() => setCommentResolved(c.id, !c.resolved))}
                    className="shrink-0 self-start text-xs"
                  >
                    {c.resolved ? 'Wieder öffnen' : 'Erledigt'}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
