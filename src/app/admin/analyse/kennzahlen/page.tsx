/**
 * Admin Analyse Kennzahlen Page
 *
 * KPIs and metrics overview.
 * Protected by role-based access control.
 *
 * Moved from /admin/hirn/kennzahlen
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import Link from 'next/link'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

  // Placeholder KPIs - these will be loaded from data sources later
  const kpis = [
    {
      category: 'Umwelt',
      metrics: [
        { name: 'Geräte gerettet', value: '[TBD]', target: '10\'000/Jahr', status: 'pending' },
        { name: 'CO2 eingespart', value: '[TBD]', target: '500t/Jahr', status: 'pending' },
        { name: 'Elektroschrott vermieden', value: '[TBD]', target: '100t/Jahr', status: 'pending' },
      ],
    },
    {
      category: 'Soziales',
      metrics: [
        { name: 'Menschen ausgebildet', value: '[TBD]', target: '500/Jahr', status: 'pending' },
        { name: 'Integrationen', value: '[TBD]', target: '50/Jahr', status: 'pending' },
        { name: 'Freiwilligenstunden', value: '[TBD]', target: '2\'000/Jahr', status: 'pending' },
      ],
    },
    {
      category: 'Finanzen',
      metrics: [
        { name: 'Eigenfinanzierung', value: '[TBD]', target: '>50%', status: 'pending' },
        { name: 'Wachstum YoY', value: '[TBD]', target: '>10%', status: 'pending' },
        { name: 'Reserven', value: '[TBD]', target: '6 Monate', status: 'pending' },
      ],
    },
  ]

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
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Kennzahlen</h1>
            <p className="text-muted-foreground">
              KPIs und Metriken auf einen Blick
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>In Entwicklung:</strong> Die KPIs werden aus dem Hirn-Wissensbasis geladen.
          Die Werte mit [TBD] werden mit echten Daten gefüllt, sobald die Datenquellen konfiguriert sind.
        </p>
      </div>

      {/* KPI Categories */}
      {kpis.map(category => (
        <Card key={category.category}>
          <CardHeader>
            <CardTitle>{category.category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {category.metrics.map(metric => (
                <div
                  key={metric.name}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="text-sm text-muted-foreground">{metric.name}</div>
                  <div className="text-2xl font-bold mt-1">{metric.value}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Ziel: {metric.target}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
