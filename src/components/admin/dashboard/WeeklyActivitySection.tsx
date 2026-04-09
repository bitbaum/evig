import { TrendingUp } from 'lucide-react'
import type { DashboardStats } from './types'
import Heading from '@/components/ui/Heading'

interface WeeklyActivitySectionProps {
  stats: DashboardStats
}

export function WeeklyActivitySection({ stats }: WeeklyActivitySectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-500" />
        <Heading level={2} className="font-semibold text-gray-900 dark:text-white">
          Diese Woche
        </Heading>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-green-600">+{stats.newUsersThisWeek}</span>{' '}
            neue Benutzer
          </span>
          <span className="text-gray-400 dark:text-gray-500">&bull;</span>
          <span className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-blue-600">{stats.postsPublishedThisWeek}</span>{' '}
            Artikel veröffentlicht
          </span>
        </div>
      </div>
    </div>
  )
}
