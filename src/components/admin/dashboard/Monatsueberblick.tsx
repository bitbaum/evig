'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { MissionMetrics } from './MissionMetrics'
import { WeeklyActivitySection } from './WeeklyActivitySection'
import type { DashboardStats } from './types'

const STORAGE_KEY = 'dashboard_monatsueberblick_open'

interface MonatsueberblickProps {
  stats: DashboardStats
}

export function Monatsueberblick({ stats }: MonatsueberblickProps) {
  // Default collapsed — open state loaded from localStorage after mount.
  // Combined into one state object so the effect does a single setState call.
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
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-xl"
        aria-expanded={open}
        aria-controls="monatsueberblick-content"
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Monatsüberblick
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Suppress content flash before localStorage is read */}
      {hydrated && open && (
        <div id="monatsueberblick-content" className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          <MissionMetrics stats={stats} />
          <WeeklyActivitySection stats={stats} />
        </div>
      )}
    </div>
  )
}
