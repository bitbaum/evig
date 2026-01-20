/**
 * Admin Hirn Dashboard - Server Component
 *
 * Main entry point for the Hirn dashboard within admin.
 * Protected by role-based access control.
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import { loadFinancialData, getAvailableYears } from '@/lib/hirn/data/financial-loader'
import { generateYearInsights } from '@/lib/hirn/data/analysis'
import { HirnDashboardClient } from './HirnDashboardClient'

export default async function HirnPage() {
  // Check authentication and authorization
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/hirn')
  }

  // Check permission for hirn section
  const hasAccess = canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'hirn')

  if (!hasAccess) {
    redirect('/admin?error=no_hirn_access')
  }

  // Get most recent year with data
  let availableYears: number[] = []
  try {
    availableYears = await getAvailableYears()
  } catch (error) {
    // If data files don't exist yet, show empty state
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Hirn Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Transparente Übersicht über Finanzen, KPIs und Wirkung
          </p>
        </div>
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800">Keine Daten verfügbar</h3>
          <p className="text-sm text-yellow-700 mt-2">
            Die Finanzdaten wurden noch nicht importiert. Bitte stellen Sie sicher,
            dass die JSON-Dateien im Ordner <code className="bg-white px-1 rounded">public/data/hirn/</code> vorhanden sind.
          </p>
        </div>
      </div>
    )
  }

  const currentYear = availableYears[0] ?? new Date().getFullYear()

  // Load real data
  const data = await loadFinancialData(currentYear)

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Hirn Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Transparente Übersicht über Finanzen, KPIs und Wirkung
          </p>
        </div>
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800">Keine Finanzdaten für {currentYear}</h3>
          <p className="text-sm text-yellow-700 mt-2">
            Bitte prüfen Sie die Datenquellen.
          </p>
        </div>
      </div>
    )
  }

  // Generate insights
  const insights = generateYearInsights(data)

  // Prepare stats for display - all from real data
  const stats = [
    {
      value: Math.round(data.totals.total.value),
      label: `Gesamteinnahmen ${currentYear}`,
      numberKey: `financial_total_${currentYear}`,
      format: 'CHF' as const,
    },
    {
      value: Math.round(data.derived.eigenfinanzierungPct.value * 10) / 10,
      label: 'Eigenfinanzierung',
      numberKey: `financial_self_financing_${currentYear}`,
      format: 'percent' as const,
    },
    {
      value: Math.round(data.derived.monthlyAvg.value),
      label: 'Monatsdurchschnitt',
      numberKey: `financial_monthly_avg_${currentYear}`,
      format: 'CHF' as const,
    },
    {
      value: Math.round(data.derived.earnedTotal.value),
      label: 'Eigenerwirtschaftet',
      numberKey: `financial_earned_${currentYear}`,
      format: 'CHF' as const,
    },
  ]

  return (
    <HirnDashboardClient
      stats={stats}
      insights={insights}
      year={currentYear}
      dataSource={{
        file: data.metadata.source,
        importedAt: data.metadata.importedAt,
      }}
      userRole={session.user.role || 'customer'}
    />
  )
}
