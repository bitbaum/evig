'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckSquare, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { adminInteractive } from '@/lib/admin-ui'
import { ROUTES } from '@/config/routes'
import { TASK_STATUS_LABELS, type TaskStatus } from '@/config/tasks'
import { cn } from '@/lib/utils'

interface TaskRow {
  id: string
  title: string
  current_status: string
  is_completed: boolean
  due_date: string | null
  priority: string
}

interface Props {
  userId: string
}

export function TeamProfileTasksTab({ userId }: Props) {
  const [rows, setRows] = useState<TaskRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const params = new URLSearchParams({ assigned_to: userId })
    const result = await apiFetch<TaskRow[]>(`/api/tasks?${params}`)
    if (result.success && result.data) {
      setRows(Array.isArray(result.data) ? result.data : [])
    } else {
      setError(result.error || 'Aufgaben konnten nicht geladen werden.')
    }
    setIsLoading(false)
  }, [userId])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load()
  }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  const openCount = rows.filter((r) => !r.is_completed).length

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-sm text-text-secondary">
          {rows.length === 0 && !isLoading
            ? 'Keine zugewiesenen Aufgaben.'
            : `${openCount} offen · ${rows.length} gesamt`}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.admin.tasksForUser(userId)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-default text-sm font-medium text-text-secondary hover:bg-surface-raised"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            In Aufgaben öffnen
          </Link>
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            Aktualisieren
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 px-4 py-2.5 text-sm text-error-700 dark:text-error-300">
          {error}
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-lg border border-subtle bg-surface-base overflow-hidden">
          <ul className="divide-y divide-subtle">
            {rows.map((row) => {
              const statusLabel =
                TASK_STATUS_LABELS[row.current_status as TaskStatus] ?? row.current_status
              return (
                <li key={row.id} className={cn('px-4 sm:px-5 py-3', adminInteractive.rowHoverFaint)}>
                  <div className="flex items-start gap-3">
                    <CheckSquare className="w-4 h-4 mt-0.5 text-text-tertiary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={ROUTES.admin.task(row.id)}
                        className="text-sm font-medium text-text-primary hover:text-action"
                      >
                        {row.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                        <span>{statusLabel}</span>
                        {row.is_completed && <span>· Erledigt</span>}
                        {row.due_date && <span>· Fällig {row.due_date}</span>}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
