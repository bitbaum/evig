'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'

interface CommunityStatsProps {
  className?: string
}

interface StatsData {
  users: number
  listings: number
  repairs: number
  workshops: number
}

function formatCount(n: number): string {
  if (n === 0) return '0'
  return `${n}`
}

const STAT_LABELS: { key: keyof StatsData; label: string }[] = [
  { key: 'users', label: 'Mitglieder' },
  { key: 'listings', label: 'Inserate' },
  { key: 'repairs', label: 'Reparaturen' },
  { key: 'workshops', label: 'Workshops' },
]

export function CommunityStats({ className = '' }: CommunityStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    apiFetch<{ data: StatsData }>('/api/stats/community')
      .then(({ data }) => {
        if (data?.data) setStats(data.data)
      })
      .catch(() => {})
  }, [])

  if (!stats) return null

  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-gray-600 ${className}`}>
      {STAT_LABELS.map(({ key, label }) => (
        <span key={key} className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-900">{formatCount(stats[key])}</span>
          {label}
        </span>
      ))}
    </div>
  )
}
