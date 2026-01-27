/**
 * Admin Analyse Finanzen Page - Server Component
 *
 * Detailed financial data view.
 * Protected by role-based access control.
 *
 * Moved from /admin/hirn/finanzen
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import { loadAllYearsData, getAvailableYears } from '@/lib/hirn/data/financial-loader'
import { generateYearInsights } from '@/lib/hirn/data/analysis'
import Link from 'next/link'
import { ArrowLeft, PiggyBank } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

  // Convert Map to array for rendering
  const yearsData = Array.from(data.entries()).sort((a, b) => b[0] - a[0])

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

      {/* Years Overview */}
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

      {/* Data Source Info */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-muted-foreground">
        <strong>Datenquelle:</strong> Kivitendo-Export • {yearsData.length} Jahre verfügbar ({availableYears[availableYears.length - 1]} - {availableYears[0]})
      </div>
    </div>
  )
}
