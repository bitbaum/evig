/**
 * Admin Hirn Wirkung Page
 *
 * Impact reporting - environmental and social impact.
 * Protected by role-based access control.
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import Link from 'next/link'
import { ArrowLeft, Target, Leaf, Users, Recycle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function WirkungPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/hirn/wirkung')
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

  const impactAreas = [
    {
      title: 'Ökologische Wirkung',
      icon: Leaf,
      color: 'green',
      description: 'Umweltschutz durch Hardware-Recycling',
      metrics: [
        { label: 'Geräte vor Entsorgung gerettet', value: '[TBD]' },
        { label: 'CO2-Äquivalent eingespart', value: '[TBD]' },
        { label: 'Rohstoffe wiederverwendet', value: '[TBD]' },
      ],
    },
    {
      title: 'Soziale Wirkung',
      icon: Users,
      color: 'blue',
      description: 'Menschen befähigen und integrieren',
      metrics: [
        { label: 'Personen in Workshops', value: '[TBD]' },
        { label: 'Berufliche Integrationen', value: '[TBD]' },
        { label: 'Freiwillige Mitarbeitende', value: '[TBD]' },
      ],
    },
    {
      title: 'Digitale Souveränität',
      icon: Recycle,
      color: 'purple',
      description: 'Open Source und digitale Bildung',
      metrics: [
        { label: 'Linux-Installationen', value: '[TBD]' },
        { label: 'Open Source Schulungen', value: '[TBD]' },
        { label: 'Beratungen durchgeführt', value: '[TBD]' },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/hirn">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Target className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Wirkung</h1>
            <p className="text-muted-foreground">
              Ökologische und soziale Wirkung von Revamp-IT
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p className="text-sm text-green-700 dark:text-green-300">
          <strong>Wirkungsbericht:</strong> Diese Seite zeigt die messbare Wirkung von Revamp-IT.
          Die Daten werden aus verschiedenen Quellen aggregiert und regelmässig aktualisiert.
        </p>
      </div>

      {/* Impact Areas */}
      <div className="grid md:grid-cols-3 gap-6">
        {impactAreas.map(area => {
          const bgColor = {
            green: 'bg-green-100 text-green-600',
            blue: 'bg-blue-100 text-blue-600',
            purple: 'bg-purple-100 text-purple-600',
          }[area.color]

          return (
            <Card key={area.title}>
              <CardHeader>
                <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <area.icon className="w-6 h-6" />
                </div>
                <CardTitle>{area.title}</CardTitle>
                <CardDescription>{area.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {area.metrics.map(metric => (
                  <div key={metric.label} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{metric.label}</span>
                    <span className="font-semibold">{metric.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* SDG Alignment */}
      <Card>
        <CardHeader>
          <CardTitle>UN Sustainable Development Goals</CardTitle>
          <CardDescription>
            Revamp-IT trägt zu mehreren SDGs bei
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { number: 4, name: 'Hochwertige Bildung' },
              { number: 8, name: 'Menschenwürdige Arbeit' },
              { number: 12, name: 'Nachhaltiger Konsum' },
              { number: 13, name: 'Massnahmen zum Klimaschutz' },
            ].map(sdg => (
              <div
                key={sdg.number}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center"
              >
                <div className="text-2xl font-bold text-primary">SDG {sdg.number}</div>
                <div className="text-xs text-muted-foreground mt-1">{sdg.name}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
