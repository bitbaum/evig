'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
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

const STAT_KEYS: (keyof StatsData)[] = ['users', 'listings', 'repairs', 'workshops']

export function CommunityStats({ className = '' }: CommunityStatsProps) {
  const t = useTranslations('home.stats')
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
    <div className={`flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-text-secondary ${className}`}>
      {STAT_KEYS.map((key) => (
        <span key={key} className="flex items-center gap-1.5">
          <span className="font-semibold text-text-primary">{formatCount(stats[key])}</span>
          {t(key)}
        </span>
      ))}
    </div>
  )
}
