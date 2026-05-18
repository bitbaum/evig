/**
 * Admin Analyse Kennzahlen Page
 *
 * Config-driven KPIs and metrics overview.
 * Protected by role-based access control.
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import { loadAllYearsData } from '@/lib/hirn/data/financial-loader'
import {
  METRICS,
  getMetricsByCategory,
  getMissingDataMetrics,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type MetricCategory,
} from '@/config/analyse/metrics'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Leaf, Users, Monitor, PiggyBank } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AnalyseTabs, KPIGrid, MissingDataBanner } from '@/components/analyse'
import Heading from '@/components/admin/AdminHeading'

const CATEGORY_ICONS = {
  financial: PiggyBank,
  environmental: Leaf,
  social: Users,
  digital: Monitor,
}

export default async function KennzahlenPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/analyse/kennzahlen')
  }

  // Check permission for kennzahlen section
  const hasAccess = canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'kennzahlen') || canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'hirn')

  if (!hasAccess) {
    redirect('/admin?error=no_kennzahlen_access')
  }

  // Load financial data for available metrics
  let financialData: Map<number, Awaited<ReturnType<typeof loadAllYearsData>> extends Map<infer K, infer V> ? V : never> = new Map()
  try {
    financialData = await loadAllYearsData()
  } catch {
    // Financial data not available
  }

  // Get latest year data
  const years = Array.from(financialData.keys()).sort((a, b) => b - a)
  const latestYear = years[0]
  const previousYear = years[1]
  const latestData = latestYear ? financialData.get(latestYear) : null
  const previousData = previousYear ? financialData.get(previousYear) : null

  // Build KPI values from financial data
  const kpiValues: Array<{ metricId: string; value?: number; previousValue?: number }> = []

  if (latestData) {
    kpiValues.push(
      {
        metricId: 'total_revenue',
        value: latestData.totals.total.value,
        previousValue: previousData?.totals.total.value,
      },
      {
        metricId: 'self_financing_rate',
        value: latestData.derived.eigenfinanzierungPct.value,
        previousValue: previousData?.derived.eigenfinanzierungPct.value,
      },
      {
        metricId: 'warenverkauf',
        value: latestData.totals.warenverkauf.value,
        previousValue: previousData?.totals.warenverkauf.value,
      },
      {
        metricId: 'dienstleistungen',
        value: latestData.totals.dienstleistungen.value,
        previousValue: previousData?.totals.dienstleistungen.value,
      },
      {
        metricId: 'integration',
        value: latestData.totals.integration.value,
        previousValue: previousData?.totals.integration.value,
      },
      {
        metricId: 'spenden',
        value: latestData.totals.spenden.value,
        previousValue: previousData?.totals.spenden.value,
      }
    )

    // Calculate YoY growth if we have previous year
    if (previousData) {
      const yoyGrowth = ((latestData.totals.total.value - previousData.totals.total.value) / previousData.totals.total.value) * 100
      kpiValues.push({
        metricId: 'yoy_growth',
        value: yoyGrowth,
      })
    }
  }

  // Get missing data metrics
  const missingMetrics = getMissingDataMetrics()

  // Categories to display
  const categories: MetricCategory[] = ['financial', 'environmental', 'social', 'digital']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/analyse">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <TrendingUp className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <Heading level={1} className="text-3xl font-bold">Kennzahlen</Heading>
            <p className="text-muted-foreground">
              KPIs und Metriken auf einen Blick
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <AnalyseTabs />

      {/* Missing Data Summary */}
      {missingMetrics.length > 0 && (
        <MissingDataBanner metrics={missingMetrics} />
      )}

      {/* Year Context */}
      {latestYear && (
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-white/[0.06] rounded-lg text-sm text-neutral-700 dark:text-neutral-300">
          Finanzielle Kennzahlen für <strong>{latestYear}</strong>
          {previousYear && (
            <span> (Vergleich mit {previousYear})</span>
          )}
        </div>
      )}

      {/* KPI Categories */}
      {categories.map(category => {
        const metrics = getMetricsByCategory(category)
        const Icon = CATEGORY_ICONS[category]
        const colors = CATEGORY_COLORS[category]
        const availableMetrics = metrics.filter(m => m.status === 'available')
        const pendingMetrics = metrics.filter(m => m.status === 'needs_data')

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 ${colors.bg} rounded-lg`}>
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
                {CATEGORY_LABELS[category]}
                {pendingMetrics.length > 0 && (
                  <span className="text-sm font-normal text-warning-600">
                    ({pendingMetrics.length} ausstehend)
                  </span>
                )}
              </CardTitle>
              {category === 'financial' && latestYear && (
                <CardDescription>
                  Daten aus Kivitendo für {latestYear}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {/* Available Metrics */}
              {availableMetrics.length > 0 && (
                <div className="mb-6">
                  <KPIGrid
                    metrics={availableMetrics}
                    values={kpiValues}
                    columns={3}
                  />
                </div>
              )}

              {/* Pending Metrics */}
              {pendingMetrics.length > 0 && (
                <div>
                  {availableMetrics.length > 0 && (
                    <Heading level={4} className="text-sm font-medium text-muted-foreground mb-3">
                      Daten benötigt
                    </Heading>
                  )}
                  <KPIGrid
                    metrics={pendingMetrics}
                    values={[]}
                    columns={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Datenquellen</CardTitle>
          <CardDescription>
            Woher die Kennzahlen stammen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
              <div className="font-medium text-primary-600">Automatisch</div>
              <div className="text-sm text-muted-foreground mt-1">
                Kivitendo-Export (Finanzen)
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Monatlich aktualisiert
              </div>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
              <div className="font-medium text-neutral-700 dark:text-neutral-300">Berechnet</div>
              <div className="text-sm text-muted-foreground mt-1">
                Abgeleitet aus anderen Metriken
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Bei Datenänderung neu berechnet
              </div>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
              <div className="font-medium text-warning-600">Manuell</div>
              <div className="text-sm text-muted-foreground mt-1">
                Manuelle Dateneingabe erforderlich
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {missingMetrics.length} Metriken ausstehend
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
