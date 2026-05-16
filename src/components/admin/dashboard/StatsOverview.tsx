import { Link } from '@/i18n/navigation'
import { Users, UserCheck, CheckSquare, Wrench } from 'lucide-react'
import type { DashboardStats } from './types'

interface StatsOverviewProps {
  stats: DashboardStats
}

const STAT_CARDS = [
  {
    href: '/admin/users',
    icon: Users,
    iconBg: 'bg-info-100 dark:bg-info-900/30',
    iconColor: 'text-info-600',
    valueKey: 'totalUsers' as const,
    label: 'Benutzer',
  },
  {
    href: '/admin/team',
    icon: UserCheck,
    iconBg: 'bg-primary-100 dark:bg-primary-900/30',
    iconColor: 'text-primary-600',
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
            className="bg-white dark:bg-neutral-900 rounded-lg p-4 shadow-sm border border-neutral-100 dark:border-white/[0.06] hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats[card.valueKey]}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{card.label}</p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
