/**
 * Admin Analytics Page — server component.
 *
 * Renders real DB counts via lib/services/analytics. The page itself
 * is now pure layout + composition — every count + growth row + activity
 * tile comes from a service call, which is the same shape any other
 * dashboard (digest email, board report) can reuse without re-querying.
 *
 * Prior version inlined ~145 lines of SQL across three helpers and
 * hand-rolled six stat cards with bespoke markup. Both moved out.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import {
  BarChart3,
  Users,
  Calendar,
  Wrench,
  Package,
  ArrowRight,
  ClipboardList,
  DollarSign,
} from 'lucide-react'
import { requireSection } from '@/lib/admin/guards'
import {
  getAnalyticsStats,
  getUserGrowth,
  getActivitySummary,
} from '@/lib/services/analytics'
import { AdminStatsGrid, type StatCardItem } from '@/components/admin/AdminStatsGrid'
import Heading from '@/components/admin/AdminHeading'
import { formatDateMonth } from '@/lib/date-formats'
import { ROUTES } from '@/config/routes'

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Statistiken und Auswertungen.',
}

export default async function AnalyticsPage() {
  await requireSection('analytics')

  const [stats, userGrowth, activity] = await Promise.all([
    getAnalyticsStats(),
    getUserGrowth(),
    getActivitySummary(),
  ])

  const statItems: StatCardItem[] = [
    {
      icon: Users,
      color: 'blue',
      label: 'Benutzer',
      value: stats.totalUsers,
      trend: stats.usersThisMonth > 0 ? `+${stats.usersThisMonth} diesen Monat` : undefined,
      trendColor: 'green',
    },
    { icon: Calendar, color: 'purple', label: 'Workshops', value: stats.totalWorkshops },
    { icon: Wrench, color: 'green', label: 'Techniker', value: stats.totalTechnicians },
    { icon: Package, color: 'orange', label: 'Verkäufer', value: stats.totalSellers },
    {
      icon: BarChart3,
      color: 'amber',
      label: 'Ausstehende Freigaben',
      value: stats.pendingApprovals,
      href: stats.pendingApprovals > 0 ? ROUTES.admin.approvals : undefined,
    },
  ]

  // Growth bar widths are normalised against the period's max so the
  // tallest bar always renders at full width.
  const growthMax = userGrowth.length > 0 ? Math.max(...userGrowth.map(g => g.count)) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-surface-raised rounded-lg flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-action" />
        </div>
        <div>
          <Heading level={1} className="text-2xl font-bold text-text-primary">
            Analytics
          </Heading>
          <p className="text-text-secondary">Statistiken und Auswertungen für RevampIT</p>
        </div>
      </div>

      <AdminStatsGrid items={statItems} columns={5} />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-surface-base rounded-xl border border">
          <Heading level={3} className="font-semibold text-text-primary mb-4">
            Benutzer-Wachstum
          </Heading>
          {userGrowth.length === 0 ? (
            <p className="text-sm text-text-tertiary">Keine Daten vorhanden</p>
          ) : (
            <div className="space-y-3">
              {userGrowth.map(item => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">
                    {formatDateMonth(`${item.month}-01`)}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-surface-raised rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-action"
                        style={{
                          width: `${Math.min(100, (item.count / Math.max(growthMax, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-text-primary w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
              <p className="text-xs text-text-tertiary mt-2">
                Registrierungen pro Monat (letzte 6 Monate)
              </p>
            </div>
          )}
        </div>

        <div className="p-6 bg-surface-base rounded-xl border border">
          <Heading level={3} className="font-semibold text-text-primary mb-4">
            Aktivitäts-Übersicht
          </Heading>
          <div className="space-y-4">
            <ActivityRow
              icon={ClipboardList}
              label="Aufgaben erledigt (diese Woche)"
              value={activity.taskCompletionsThisWeek}
            />
            <ActivityRow
              icon={ClipboardList}
              label="Aufgaben erledigt (diesen Monat)"
              value={activity.taskCompletionsThisMonth}
            />
            <ActivityRow
              icon={Package}
              label="Neue Einreichungen (diesen Monat)"
              value={activity.contentSubmissionsThisMonth}
            />
            <ActivityRow
              icon={ClipboardList}
              label="Aktive Aufgaben"
              value={activity.activeTasksCount}
              muted
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <DrillDownLink
          href={ROUTES.admin.analyseFinanzen}
          icon={DollarSign}
          title="Finanz-Analyse"
          description="Detaillierte Finanz-Statistiken und Diagramme"
        />
        <DrillDownLink
          href={ROUTES.admin.tasksAnalytics}
          icon={ClipboardList}
          title="Aufgaben-Analyse"
          description="Beiträge, Kategorien und Verlauf"
        />
      </div>

      <div className="p-6 bg-surface-raised border border rounded-xl">
        <p className="text-sm text-text-secondary">
          <strong>Hinweis:</strong> Die Statistiken werden in Echtzeit aus der Datenbank
          berechnet. Für detaillierte Finanz-Analytics, siehe{' '}
          <Link href={ROUTES.admin.analyseFinanzen} className="underline hover:text-text-primary">
            Finanzen-Analyse
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

function ActivityRow({
  icon: Icon,
  label,
  value,
  muted = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  muted?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${
        muted ? 'bg-surface-raised' : 'bg-action-muted'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${muted ? 'text-text-secondary' : 'text-action'}`} />
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <span className={`text-lg font-bold ${muted ? 'text-text-primary' : 'text-action'}`}>
        {value}
      </span>
    </div>
  )
}

function DrillDownLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-4 bg-surface-base rounded-xl border border hover:border-action transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-action-muted rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-action" />
        </div>
        <div>
          <p className="font-medium text-text-primary">{title}</p>
          <p className="text-sm text-text-tertiary">{description}</p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-action transition-colors" />
    </Link>
  )
}
