'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, ChevronDown } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { MissionMetrics } from './MissionMetrics'
import { WeeklyActivitySection } from './WeeklyActivitySection'
import type { DashboardStats } from './types'

const STORAGE_KEY = 'dashboard_monatsueberblick_open'

interface MonatsueberblickProps {
  stats: DashboardStats
}

export function Monatsueberblick({ stats }: MonatsueberblickProps) {
  // Combined state so useEffect does a single setState call (avoids cascade-render lint warning)
  const [{ open, hydrated }, setMeta] = useState({ open: false, hydrated: false })

  useEffect(() => {
    // Reading localStorage is an external system sync — legitimate setState in effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMeta({ open: localStorage.getItem(STORAGE_KEY) === 'true', hydrated: true })
  }, [])

  const toggle = () => {
    const next = !open
    localStorage.setItem(STORAGE_KEY, String(next))
    setMeta({ open: next, hydrated: true })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      {/* Toggle header — same structure as card headers, but interactive */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-xl"
        aria-expanded={open}
        aria-controls="monatsueberblick-content"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Monatsüberblick
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Content — suppressed before localStorage hydrates to prevent flash */}
      {hydrated && open && (
        <div
          id="monatsueberblick-content"
          className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-4"
        >
          <MissionMetrics stats={stats} />
          <WeeklyActivitySection stats={stats} />
        </div>
      )}
    </div>
  )
}
