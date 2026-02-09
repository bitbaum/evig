/**
 * Admin Analyse Finanzen Page - Server Component
 *
 * Detailed financial data view with charts.
 * Protected by role-based access control.
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import { loadAllYearsData, getAvailableYears } from '@/lib/hirn/data/financial-loader'
import { compareYears, generateYearInsights } from '@/lib/hirn/data/analysis'
import Link from 'next/link'
import { ArrowLeft, PiggyBank, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AnalyseTabs, RevenueAreaChart, RevenuePieChart, TrendBarChart } from '@/components/analyse'

const CATEGORY_LABELS = {
  warenverkauf: 'Warenverkauf',
  dienstleistungen: 'Dienstleistungen',
  integration: 'Integration',
  spenden: 'Spenden',
  aufstockung: 'Aufstockung',
}

export default async function FinanzenPage() {
  // Check authentication and authorization
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/analyse/finanzen')
  }

  // Check permission for finanzen section (or legacy 'finances' alias)
  const hasAccess = canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'finanzen') || canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'finances')

  if (!hasAccess) {
    redirect('/admin?error=no_finances_access')
  }

  // Load financial data
  let data: Map<number, Awaited<ReturnType<typeof loadAllYearsData>> extends Map<infer K, infer V> ? V : never> = new Map()
  let availableYears: number[] = []

  try {
    availableYears = await getAvailableYears()
    data = await loadAllYearsData()
  } catch {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Finanzen</h1>
        </div>
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800">Keine Daten verfügbar</h3>
          <p className="text-sm text-yellow-700 mt-2">
            Die Finanzdaten konnten nicht geladen werden.
          </p>
        </div>
      </div>
    )
  }

  // Convert Map to array for rendering (newest first)
  const yearsData = Array.from(data.entries()).sort((a, b) => b[0] - a[0])

  // Prepare chart data
  const chartData = yearsData.map(([year, yearData]) => ({
    year,
    warenverkauf: yearData.totals.warenverkauf.value,
    dienstleistungen: yearData.totals.dienstleistungen.value,
    integration: yearData.totals.integration.value,
    spenden: yearData.totals.spenden.value,
    aufstockung: yearData.totals.aufstockung.value,
    total: yearData.totals.total.value,
  }))

  // Get latest two years for comparison
  const latestYear = yearsData[0]
  const previousYear = yearsData[1]

  let comparison = null
  let insights = null
  if (latestYear && previousYear) {
    comparison = compareYears(latestYear[1], previousYear[1])
  }
  if (latestYear) {
    insights = generateYearInsights(latestYear[1])
  }

  // Prepare trend comparison data
  const trendData = latestYear && previousYear ? [
    {
      category: 'Warenverkauf',
      currentValue: latestYear[1].totals.warenverkauf.value,
      previousValue: previousYear[1].totals.warenverkauf.value,
      percentChange: comparison?.categoryChanges.warenverkauf.percentChange || 0,
    },
    {
      category: 'Dienstleistungen',
      currentValue: latestYear[1].totals.dienstleistungen.value,
      previousValue: previousYear[1].totals.dienstleistungen.value,
      percentChange: comparison?.categoryChanges.dienstleistungen.percentChange || 0,
    },
    {
      category: 'Integration',
      currentValue: latestYear[1].totals.integration.value,
      previousValue: previousYear[1].totals.integration.value,
      percentChange: comparison?.categoryChanges.integration.percentChange || 0,
    },
    {
      category: 'Spenden',
      currentValue: latestYear[1].totals.spenden.value,
      previousValue: previousYear[1].totals.spenden.value,
      percentChange: comparison?.categoryChanges.spenden.percentChange || 0,
    },
  ] : []

  // Filter actionable insights
  const actionableInsights = [
    ...(comparison?.insights || []),
    ...(insights || []),
  ].filter(i => i.priority === 'high' || i.priority === 'medium')

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
          <div className="p-2 bg-blue-100 rounded-lg">
            <PiggyBank className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Finanzen</h1>
            <p className="text-muted-foreground">
              Detaillierte Finanzübersicht aller Jahre
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <AnalyseTabs />

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <RevenueAreaChart
          data={chartData}
          source="Kivitendo"
          sourceDate={latestYear?.[1].metadata.importedAt ? formatDateShort(latestYear[1].metadata.importedAt) : undefined}
        />

        {/* Latest Year Breakdown */}
        {latestYear && (
          <RevenuePieChart
            data={{
              warenverkauf: latestYear[1].totals.warenverkauf.value,
              dienstleistungen: latestYear[1].totals.dienstleistungen.value,
              integration: latestYear[1].totals.integration.value,
              spenden: latestYear[1].totals.spenden.value,
              aufstockung: latestYear[1].totals.aufstockung.value,
            }}
            year={latestYear[0]}
            source="Kivitendo"
          />
        )}
      </div>

      {/* Year-over-Year Comparison */}
      {latestYear && previousYear && trendData.length > 0 && (
        <TrendBarChart
          data={trendData}
          currentYear={latestYear[0]}
          previousYear={previousYear[0]}
          source="Kivitendo"
        />
      )}

      {/* Insights */}
      {actionableInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Erkenntnisse & Handlungsempfehlungen
            </CardTitle>
            <CardDescription>
              Basierend auf der Analyse von {latestYear?.[0]} im Vergleich zum Vorjahr
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {actionableInsights.map(insight => (
                <li
                  key={insight.id}
                  className={`border-l-4 pl-4 ${
                    insight.priority === 'high' ? 'border-red-400' :
                    insight.priority === 'medium' ? 'border-amber-400' : 'border-green-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {insight.type === 'positive' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : insight.type === 'warning' ? (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        ) : null}
                        {insight.title}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {insight.description}
                      </div>
                      {insight.implication && (
                        <div className="text-sm text-muted-foreground mt-1 italic">
                          {insight.implication}
                        </div>
                      )}
                      {insight.recommendation && (
                        <div className="text-sm font-medium mt-2 text-blue-700 dark:text-blue-400">
                          → {insight.recommendation}
                        </div>
                      )}
                    </div>
                    {insight.valueFormatted && (
                      <span className={`text-lg font-bold ${
                        insight.type === 'positive' ? 'text-green-600' :
                        insight.type === 'warning' ? 'text-amber-600' : ''
                      }`}>
                        {insight.valueFormatted}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Years Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Jahresübersicht</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yearsData.map(([year, yearData]) => {
            const selfFinancingPct = yearData.derived.eigenfinanzierungPct.value

            return (
              <Card key={year}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{year}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      selfFinancingPct >= 50
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selfFinancingPct.toFixed(1)}% Eigenfinanzierung
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gesamteinnahmen</span>
                    <span className="font-semibold">
                      CHF {Math.round(yearData.totals.total.value).toLocaleString('de-CH')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Warenverkauf</span>
                    <span>
                      CHF {Math.round(yearData.totals.warenverkauf.value).toLocaleString('de-CH')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dienstleistungen</span>
                    <span>
                      CHF {Math.round(yearData.totals.dienstleistungen.value).toLocaleString('de-CH')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spenden</span>
                    <span>
                      CHF {Math.round(yearData.totals.spenden.value).toLocaleString('de-CH')}
                    </span>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    Quelle: {yearData.metadata.source}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Data Source Info */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-muted-foreground">
        <strong>Datenquelle:</strong> Kivitendo-Export • {yearsData.length} Jahre verfügbar ({availableYears[availableYears.length - 1]} - {availableYears[0]})
      </div>
    </div>
  )
}
