'use client'

/**
 * TeamProfileActivityTab — Aktivität tab on the team-profile detail page.
 *
 * Reads /api/admin/team/activity?user_id=<id> (the endpoint already
 * supports the user_id filter — verified before building this) and
 * renders the activity stream scoped to that one person. Same shape as
 * the global /admin/team/activity feed but without the user-picker,
 * because we're already in someone's profile.
 */

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { formatDateTime } from '@/lib/date-formats'

interface ActivityEvent {
  id: string
  type?: string
  action: string
  title?: string | null
  description?: string | null
  occurred_at: string
  subject_type?: string | null
  subject_id?: string | null
  subject_label?: string | null
}

interface ActivityResponse {
  items?: ActivityEvent[]
  events?: ActivityEvent[]
  total?: number
}

interface Props {
  userId: string
}

export function TeamProfileActivityTab({ userId }: Props) {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const params = new URLSearchParams({ user_id: userId, limit: '50' })
    const result = await apiFetch<ActivityResponse>(`/api/admin/team/activity?${params}`)
    if (result.success && result.data) {
      // The endpoint historically used either `items` or `events` — accept either.
      setEvents(result.data.items ?? result.data.events ?? [])
    } else {
      setError(result.error || 'Aktivität konnte nicht geladen werden.')
    }
    setIsLoading(false)
  }, [userId])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load()
  }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          {events.length === 0 && !isLoading ? 'Noch keine Aktivität.' : `${events.length} Ereignisse`}
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-600 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/[0.04] disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 px-4 py-2.5 text-sm text-error-700 dark:text-error-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {events.length > 0 && (
        <ol className="relative border-l border-neutral-200 dark:border-white/[0.06] ml-1.5 space-y-3">
          {events.map(event => (
            <li key={event.id} className="ml-4 pl-3">
              <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-primary-500 ring-4 ring-white dark:ring-neutral-950" />
              <div className="rounded-lg border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-neutral-900 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-neutral-900 dark:text-white">
                      {event.title || event.action}
                    </div>
                    {event.subject_label && (
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {event.subject_label}
                      </div>
                    )}
                  </div>
                  <time className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                    {formatDateTime(event.occurred_at)}
                  </time>
                </div>
                {event.description && (
                  <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                    {event.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
