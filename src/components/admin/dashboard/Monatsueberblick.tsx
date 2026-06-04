'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, ChevronDown } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { MissionMetrics } from './MissionMetrics'
import { WeeklyActivitySection } from './WeeklyActivitySection'
import type { DashboardStats } from './types'

const STORAGE_KEY = 'dashboard_monatsueberblick_open'

interface MonatsueberblickProps {
  stats: DashboardStats
  /** When true, defaults to expanded (for 'lead' dashboard mode) */
  defaultOpen?: boolean
  /** Optional extra content (e.g. TeamActivityFeed for 'lead' mode) */
  children?: React.ReactNode
}

export function Monatsueberblick({ stats, defaultOpen = false, children }: MonatsueberblickProps) {
  // Combined state so useEffect does a single setState call (avoids cascade-render lint warning)
  const [{ open, hydrated }, setMeta] = useState({ open: defaultOpen, hydrated: false })

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    // Reading localStorage is an external system sync — setState in effect is intentional.
    setMeta({
      // Stored preference wins; fall back to prop (defaultOpen for 'lead' mode)
      open: stored !== null ? stored === 'true' : defaultOpen,
      hydrated: true,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggle = () => {
    const next = !open
    localStorage.setItem(STORAGE_KEY, String(next))
    setMeta({ open: next, hydrated: true })
  }

  return (
    <div className="bg-surface-base rounded-xl shadow-sm border border-subtle dark:border-white/[0.06]">
      {/* Toggle header — same structure as card headers, but interactive */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 dark:hover:bg-white/[0.06]/50 transition-colors rounded-xl"
        aria-expanded={open}
        aria-controls="monatsueberblick-content"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-500 flex-shrink-0" aria-hidden="true" />
          <Heading level={2} className="font-semibold text-text-primary">
            Monatsüberblick
          </Heading>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Content — suppressed before localStorage hydrates to prevent flash */}
      {hydrated && open && (
        <div
          id="monatsueberblick-content"
          className="border-t border-subtle dark:border-white/[0.06] p-4 space-y-4"
        >
          <MissionMetrics stats={stats} />
          <WeeklyActivitySection stats={stats} />
          {children}
        </div>
      )}
    </div>
  )
}
