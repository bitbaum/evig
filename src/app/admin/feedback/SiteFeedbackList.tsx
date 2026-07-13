'use client'

import { useMemo, useState, useTransition } from 'react'
import { Copy, Check, MessageSquare, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setSuggestionResolved } from './actions'

type Item = {
  id: string
  suggestion: string
  contact: string | null
  page: string | null
  url: string | null
  pageTitle: string | null
  pageSection: string | null
  scope: string | null
  resolved: boolean
  createdAt: string | null
}

export function SiteFeedbackList({ items }: { items: Item[] }) {
  const [showResolved, setShowResolved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  const visible = useMemo(
    () => items.filter(i => showResolved || !i.resolved),
    [items, showResolved],
  )

  function copyPrompt() {
    const use = visible.filter(i => !i.resolved).length ? visible.filter(i => !i.resolved) : visible
    const lines = ['Website-Feedback (revamp-it):', '']
    for (const i of use) {
      const where = i.pageTitle || i.page || 'Website'
      const who = i.contact ? ` [${i.contact}]` : ''
      lines.push(`— ${where}${i.page ? ` (${i.page})` : ''}: ${i.suggestion.trim()}${who}`)
    }
    const text = lines.join('\n')
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1800) }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(done)
    else done()
  }

  const openCount = items.filter(i => !i.resolved).length

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border px-4 py-12 text-center text-sm text-text-secondary">
        <MessageSquare className="w-6 h-6 mx-auto mb-2 text-text-muted" aria-hidden="true" />
        Noch kein Website-Feedback. Sobald jemand über den Feedback-Knopf schreibt, erscheint es hier.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} />
          Erledigte anzeigen ({items.length - openCount} erledigt · {openCount} offen)
        </label>
        <Button variant="outline" size="sm" onClick={copyPrompt}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Kopiert' : 'Als Prompt kopieren'}
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border px-4 py-10 text-center text-sm text-text-secondary">
          Alles erledigt. 🎉
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map(i => (
            <li key={i.id} className={`rounded-xl border border bg-surface-base p-4 ${i.resolved ? 'opacity-55' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mb-1">
                    <span className="font-mono">{i.pageTitle || 'Website'}</span>
                    {i.page && (
                      i.url ? (
                        <a href={i.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary underline">
                          {i.page}<ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      ) : <span>{i.page}</span>
                    )}
                    {i.scope && <span className="px-1.5 py-0.5 rounded bg-surface-raised">{i.scope}</span>}
                  </div>
                  <p className="text-sm text-text-primary whitespace-pre-wrap break-words">{i.suggestion}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-text-muted">
                    <span>{i.contact || 'Anonym'}</span>
                    {i.createdAt && <span>· {new Date(i.createdAt).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => startTransition(() => setSuggestionResolved(i.id, !i.resolved))}
                  className="shrink-0 text-xs"
                >
                  {i.resolved ? 'Wieder öffnen' : 'Erledigt'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
