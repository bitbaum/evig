import Link from 'next/link'
import { Users, UserCheck, Wrench, Monitor } from 'lucide-react'
import type { DashboardStats, MissionDelta } from './types'

interface MissionMetricsProps {
  stats: DashboardStats
}

const MONTH_LABEL = new Date().toLocaleString('de-CH', { month: 'long' })

function DeltaBadge({ value }: { value: number }) {
  if (value === 0) return (
    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">±0</span>
  )
  const positive = value > 0
  return (
    <span className={`text-xs font-semibold ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      {positive ? '+' : ''}{value}
    </span>
  )
}

export function MissionMetrics({ stats }: MissionMetricsProps) {
  const { mission, delta } = stats

  const missionCards: Array<{
    value: number
    delta: number
    label: string
    sublabel: string
    icon: typeof Monitor
    iconBg: string
    iconColor: string
    href: string
  }> = [
    {
      value: mission.devicesProcessedThisMonth,
      delta: delta.devicesProcessed,
      label: 'Geräte erfasst',
      sublabel: MONTH_LABEL,
      icon: Monitor,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      href: '/admin/erfassung',
    },
    {
      value: mission.devicesSoldThisMonth,
      delta: delta.devicesSold,
      label: 'Geräte verkauft',
      sublabel: MONTH_LABEL,
      icon: Monitor,
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      href: '/admin/products',
    },
    {
      value: mission.itHilfeCompletedThisMonth,
      delta: delta.itHilfeCompleted,
      label: 'IT-Hilfen abgeschlossen',
      sublabel: MONTH_LABEL,
      icon: Wrench,
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      href: '/admin/it-hilfe',
    },
    {
      value: mission.workshopAttendeesThisMonth,
      delta: delta.workshopAttendees,
      label: 'Workshop-Teilnahmen',
      sublabel: MONTH_LABEL,
      icon: Users,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      href: '/admin/workshops',
    },
  ]

  return (
    <div className="space-y-3">
      {/* Mission / impact cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {missionCards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                      {card.value}
                    </p>
                    <DeltaBadge value={card.delta} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {card.label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {card.sublabel}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Reference stats — collapsed into a single compact row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
        <Link href="/admin/users" className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <Users className="w-3.5 h-3.5" aria-hidden="true" />
          <span><strong className="text-gray-700 dark:text-gray-200">{stats.totalUsers}</strong> Benutzer</span>
        </Link>
        <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">·</span>
        <Link href="/admin/team" className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span><strong className="text-gray-700 dark:text-gray-200">{stats.totalStaff}</strong> Team</span>
        </Link>
        <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">·</span>
        <Link href="/admin/services" className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
          <span><strong className="text-gray-700 dark:text-gray-200">{stats.totalTechnicians}</strong> Techniker</span>
        </Link>
        <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">·</span>
        <Link href="/admin/marketplace" className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <span><strong className="text-gray-700 dark:text-gray-200">{stats.activeListings}</strong> aktive Inserate</span>
        </Link>
      </div>
    </div>
  )
}
