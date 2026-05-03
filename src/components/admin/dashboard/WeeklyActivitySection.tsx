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
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700">
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-700 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary-500" aria-hidden="true" />
        <Heading level={2} className="font-semibold text-neutral-900 dark:text-white">
          Diese Woche
        </Heading>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {stats.newUsersThisWeek > 0 && (
            <span className="text-neutral-700 dark:text-neutral-300">
              <span className="font-semibold text-primary-600">+{stats.newUsersThisWeek}</span>{' '}
              neue Benutzer
            </span>
          )}
          {stats.newUsersThisWeek > 0 && stats.postsPublishedThisWeek > 0 && (
            <span className="text-neutral-400 dark:text-neutral-500" aria-hidden="true">&bull;</span>
          )}
          {stats.postsPublishedThisWeek > 0 && (
            <span className="text-neutral-700 dark:text-neutral-300">
              <span className="font-semibold text-blue-600">{stats.postsPublishedThisWeek}</span>{' '}
              Artikel veröffentlicht
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
