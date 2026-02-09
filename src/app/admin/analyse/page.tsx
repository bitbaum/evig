/**
 * Admin Analyse Overview Page
 *
 * Dashboard showing key metrics from all sections.
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import { loadAllYearsData } from '@/lib/hirn/data/financial-loader'
import { compareYears, generateYearInsights } from '@/lib/hirn/data/analysis'
import { getMissingDataMetrics, getMetricsByCategory, CATEGORY_LABELS } from '@/config/analyse/metrics'
import Link from 'next/link'
import { ArrowLeft, BarChart3, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AnalyseTabs } from '@/components/analyse'
import { formatCHF } from '@/lib/hirn/format'

export default async function AnalysePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/analyse')
  }

  // Check permission for analyse sections
  const hasAccess = canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'finanzen') || canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'hirn')

  if (!hasAccess) {
    redirect('/admin?error=no_analyse_access')
  }

  // Load financial data
  let allData: Map<number, Awaited<ReturnType<typeof loadAllYearsData>> extends Map<infer K, infer V> ? V : never> = new Map()
  let latestYear: number | null = null
  let previousYear: number | null = null

  try {
    allData = await loadAllYearsData()
    const years = Array.from(allData.keys()).sort((a, b) => b - a)
    latestYear = years[0] || null
    previousYear = years[1] || null
  } catch {
    // Data loading failed, show without financial metrics
  }

  const latestData = latestYear ? allData.get(latestYear) : null
  const previousData = previousYear ? allData.get(previousYear) : null

  // Generate insights
  let comparison = null
  let yearInsights = null
  if (latestData && previousData) {
    comparison = compareYears(latestData, previousData)
  }
  if (latestData) {
    yearInsights = generateYearInsights(latestData)
  }

  // Get missing data metrics
  const missingMetrics = getMissingDataMetrics()
  const missingByTeam: Record<string, typeof missingMetrics> = {}
  for (const metric of missingMetrics) {
    const team = metric.responsibleTeam || 'Unbekannt'
    if (!missingByTeam[team]) {
      missingByTeam[team] = []
    }
    missingByTeam[team].push(metric)
  }

  // Filter high priority insights
  const highPriorityInsights = [
    ...(comparison?.insights || []),
    ...(yearInsights || []),
  ].filter(i => i.priority === 'high')

  const positiveInsights = [
    ...(comparison?.insights || []),
    ...(yearInsights || []),
  ].filter(i => i.type === 'positive').slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Analyse</h1>
            <p className="text-muted-foreground">
              Übersicht aller Kennzahlen und Metriken
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <AnalyseTabs />

      {/* Key Metrics */}
      {latestData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Gesamteinnahmen {latestYear}</div>
              <div className="text-3xl font-bold mt-1">
                {formatCHF(latestData.totals.total.value)}
              </div>
              {comparison && (
                <div className={`text-sm mt-2 ${
                  comparison.totalChange.direction === 'up' ? 'text-green-600' :
                  comparison.totalChange.direction === 'down' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {comparison.totalChange.direction === 'up' ? '+' : ''}
                  {comparison.totalChange.percentChange.toFixed(1)}% vs. {previousYear}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Eigenfinanzierung {latestYear}</div>
              <div className="text-3xl font-bold mt-1">
                {latestData.derived.eigenfinanzierungPct.value.toFixed(1)}%
              </div>
              <div className={`text-sm mt-2 ${
                latestData.derived.eigenfinanzierungPct.value >= 50 ? 'text-green-600' : 'text-amber-600'
              }`}>
                {latestData.derived.eigenfinanzierungPct.value >= 50 ? 'Ziel erreicht' : 'Unter Ziel (50%)'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Datenqualität</div>
              <div className="text-3xl font-bold mt-1">
                {missingMetrics.length} ausstehend
              </div>
              <div className="text-sm mt-2 text-amber-600">
                {Object.keys(missingByTeam).length} Teams betroffen
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Missing Data Alert */}
      {missingMetrics.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-5 h-5" />
              Daten benötigt ({missingMetrics.length})
            </CardTitle>
            <CardDescription className="text-amber-600 dark:text-amber-400">
              Folgende Kennzahlen können ohne manuelle Dateneingabe nicht berechnet werden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(missingByTeam).slice(0, 6).map(([team, metrics]) => (
                <div key={team} className="text-sm">
                  <div className="font-medium text-amber-800 dark:text-amber-200">{team}</div>
                  <ul className="mt-1 space-y-1">
                    {metrics.slice(0, 3).map(m => (
                      <li key={m.id} className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <span className="text-amber-500">•</span>
                        {m.name}
                      </li>
                    ))}
                    {metrics.length > 3 && (
                      <li className="text-amber-600 dark:text-amber-400">
                        +{metrics.length - 3} weitere
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/admin/analyse/kennzahlen">
                <Button variant="outline" size="sm" className="text-amber-700 border-amber-300 hover:bg-amber-100">
                  Alle Kennzahlen anzeigen
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* High Priority Insights */}
        {highPriorityInsights.length > 0 && (
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                Handlungsbedarf
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {highPriorityInsights.map(insight => (
                  <li key={insight.id} className="border-l-4 border-red-400 pl-3">
                    <div className="font-medium">{insight.title}</div>
                    <div className="text-sm text-muted-foreground">{insight.description}</div>
                    {insight.recommendation && (
                      <div className="text-sm text-red-700 mt-1">
                        → {insight.recommendation}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Positive Insights */}
        {positiveInsights.length > 0 && (
          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                Positive Entwicklungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {positiveInsights.map(insight => (
                  <li key={insight.id} className="border-l-4 border-green-400 pl-3">
                    <div className="font-medium">{insight.title}</div>
                    <div className="text-sm text-muted-foreground">{insight.description}</div>
                    {insight.implication && (
                      <div className="text-sm text-green-700 mt-1">
                        {insight.implication}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/admin/analyse/finanzen" className="block">
          <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="font-medium">Finanzen</div>
              <div className="text-sm text-muted-foreground">
                {allData.size} Jahre Daten
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/analyse/kennzahlen" className="block">
          <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="font-medium">Kennzahlen</div>
              <div className="text-sm text-muted-foreground">
                {missingMetrics.length} ausstehend
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/analyse/wirkung" className="block">
          <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="font-medium">Wirkung</div>
              <div className="text-sm text-muted-foreground">
                Impact-Metriken
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/analyse/transparenz" className="block">
          <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="font-medium">Transparenz</div>
              <div className="text-sm text-muted-foreground">
                Methodologie
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Data Source */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-muted-foreground">
        <strong>Datenquellen:</strong> Finanzdaten aus Kivitendo • Letzte Aktualisierung: {latestData?.metadata.importedAt ? new Date(latestData.metadata.importedAt).toLocaleDateString('de-CH') : 'N/A'}
      </div>
    </div>
  )
}
