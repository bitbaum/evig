import { TrendingUp } from 'lucide-react'
import type { DashboardStats } from './types'
import Heading from '@/components/admin/AdminHeading'

interface WeeklyActivitySectionProps {
  stats: DashboardStats
}

export function WeeklyActivitySection({ stats }: WeeklyActivitySectionProps) {
  // Nothing meaningful to show when both are zero — hide instead of showing dead numbers
  if (stats.newUsersThisWeek === 0 && stats.postsPublishedThisWeek === 0) return null

  return (
    <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6">
      <div className="p-4 border-b border-subtle dark:border-white/6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-action" aria-hidden="true" />
        <Heading level={2} className="font-semibold text-text-primary">
          Diese Woche
        </Heading>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {stats.newUsersThisWeek > 0 && (
            <span className="text-text-secondary">
              <span className="font-semibold text-action">+{stats.newUsersThisWeek}</span>{' '}
              neue Benutzer
            </span>
          )}
          {stats.newUsersThisWeek > 0 && stats.postsPublishedThisWeek > 0 && (
            <span className="text-text-muted" aria-hidden="true">&bull;</span>
          )}
          {stats.postsPublishedThisWeek > 0 && (
            <span className="text-text-secondary">
              <span className="font-semibold text-action">{stats.postsPublishedThisWeek}</span>{' '}
              Artikel veröffentlicht
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
