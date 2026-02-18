import Link from 'next/link'
import { Users, UserCheck, CheckSquare, Wrench } from 'lucide-react'
import type { DashboardStats } from './types'

interface StatsOverviewProps {
  stats: DashboardStats
}

const STAT_CARDS = [
  {
    href: '/admin/users',
    icon: Users,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600',
    valueKey: 'totalUsers' as const,
    label: 'Benutzer',
  },
  {
    href: '/admin/team',
    icon: UserCheck,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600',
    valueKey: 'totalStaff' as const,
    label: 'Team',
  },
  {
    href: '/admin/approvals',
    icon: CheckSquare,
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600',
    valueKey: 'pendingApprovals' as const,
    label: 'Freigaben',
  },
  {
    href: '/admin/services',
    icon: Wrench,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600',
    valueKey: 'totalTechnicians' as const,
    label: 'Techniker',
  },
] as const

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STAT_CARDS.map((card) => {
        const Icon = card.icon
        return (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats[card.valueKey]}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
