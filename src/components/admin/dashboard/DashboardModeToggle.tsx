'use client'

import { useState, useTransition } from 'react'
import { apiFetch } from '@/lib/api/client'

type DashboardMode = 'coordinator' | 'lead' | 'volunteer'

interface DashboardModeToggleProps {
  current: DashboardMode
}

const MODES: { id: DashboardMode; label: string }[] = [
  { id: 'coordinator', label: 'Koordination' },
  { id: 'lead', label: 'Leitung' },
  { id: 'volunteer', label: 'Ehrenamt' },
]

export function DashboardModeToggle({ current }: DashboardModeToggleProps) {
  const [active, setActive] = useState<DashboardMode>(current)
  const [isPending, startTransition] = useTransition()

  const select = (mode: DashboardMode) => {
    if (mode === active || isPending) return
    setActive(mode)
    startTransition(async () => {
      await apiFetch<unknown>('/api/me/preferences', {
        method: 'PATCH',
        body: { dashboardMode: mode },
      })
    })
  }

  return (
    <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
      {MODES.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => select(id)}
          disabled={isPending}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors min-h-[28px] ${
            active === id
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          aria-pressed={active === id}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
