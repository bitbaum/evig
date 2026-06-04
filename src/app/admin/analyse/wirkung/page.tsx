/**
 * Admin Analyse Wirkung Page
 *
 * Impact reporting - environmental and social impact.
 * Protected by role-based access control.
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import {
  getMetricsByCategory,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type MetricDefinition,
} from '@/config/analyse/metrics'
import Link from 'next/link'
import { ArrowLeft, Target, Leaf, Users, Recycle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AnalyseTabs, MissingDataBanner } from '@/components/analyse'
import Heading from '@/components/admin/AdminHeading'
import { ROUTES } from '@/config/routes'

function ImpactCard({ metric }: { metric: MetricDefinition }) {
  const needsData = metric.status === 'needs_data'

  return (
    <div className="p-4 bg-surface-raised rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm text-muted-foreground">{metric.name}</div>
        {needsData && (
          <AlertCircle className="w-4 h-4 text-warning-500" />
        )}
      </div>
      <div className={`text-2xl font-bold ${needsData ? 'text-warning-500' : ''}`}>
        {needsData ? '[TBD]' : '—'}
      </div>
      {metric.target && (
        <div className="text-xs text-muted-foreground mt-2">
          Ziel: {metric.target}
        </div>
      )}
      {needsData && metric.dataNeeded && (
        <div className="text-xs text-warning-600 mt-2">
          Benötigt: {metric.dataNeeded}
        </div>
      )}
    </div>
  )
}

export default async function WirkungPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/analyse/wirkung')
  }

  // Check permission for wirkung section
  const hasAccess = canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'wirkung') || canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'hirn')

  if (!hasAccess) {
    redirect('/admin?error=no_wirkung_access')
  }

  // Get impact-related metrics
  const environmentalMetrics = getMetricsByCategory('environmental')
  const socialMetrics = getMetricsByCategory('social')
  const digitalMetrics = getMetricsByCategory('digital')

  // Combine all impact metrics for missing data banner
  const allImpactMetrics = [...environmentalMetrics, ...socialMetrics, ...digitalMetrics]
  const missingMetrics = allImpactMetrics.filter(m => m.status === 'needs_data')

  const impactAreas = [
    {
      title: 'Ökologische Wirkung',
      icon: Leaf,
      color: 'green',
      description: 'Umweltschutz durch Hardware-Recycling',
      metrics: environmentalMetrics,
    },
    {
      title: 'Soziale Wirkung',
      icon: Users,
      color: 'blue',
      description: 'Menschen befähigen und integrieren',
      metrics: socialMetrics,
    },
    {
      title: 'Digitale Souveränität',
      icon: Recycle,
      color: 'purple',
      description: 'Open Source und digitale Bildung',
      metrics: digitalMetrics,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={ROUTES.admin.analyse}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-action-muted-muted rounded-lg">
            <Target className="w-6 h-6 text-action" />
          </div>
          <div>
            <Heading level={1} className="text-3xl font-bold">Wirkung</Heading>
            <p className="text-muted-foreground">
              Ökologische und soziale Wirkung von Revamp-IT
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

      {/* Info Banner */}
      <div className="p-4 bg-action-muted-muted border border-strong rounded-lg">
        <p className="text-sm text-action">
          <strong>Wirkungsbericht:</strong> Diese Seite zeigt die messbare Wirkung von Revamp-IT.
          Die Daten werden aus verschiedenen Quellen aggregiert und regelmässig aktualisiert.
          {missingMetrics.length > 0 && (
            <span className="block mt-2 text-warning-700 dark:text-warning-300">
              <AlertCircle className="inline w-4 h-4 mr-1" />
              {missingMetrics.length} Metriken benötigen noch Daten für vollständige Berichterstattung.
            </span>
          )}
        </p>
      </div>

      {/* Impact Areas */}
      <div className="grid md:grid-cols-3 gap-6">
        {impactAreas.map(area => {
          const bgColor = {
            green: 'bg-action-muted-muted text-action',
            blue: 'bg-surface-raised text-text-secondary',
            purple: 'bg-action-muted-muted text-action',
          }[area.color]

          const pendingCount = area.metrics.filter(m => m.status === 'needs_data').length

          return (
            <Card key={area.title}>
              <CardHeader>
                <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <area.icon className="w-6 h-6" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  {area.title}
                  {pendingCount > 0 && (
                    <span className="text-xs font-normal px-2 py-0.5 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-200 rounded-sm">
                      {pendingCount} ausstehend
                    </span>
                  )}
                </CardTitle>
                <CardDescription>{area.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {area.metrics.map(metric => (
                  <ImpactCard key={metric.id} metric={metric} />
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Impact Calculation Methodology */}
      <Card>
        <CardHeader>
          <CardTitle>Berechnungsmethodik</CardTitle>
          <CardDescription>
            Wie wir unsere Wirkung messen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Heading level={4} className="font-medium mb-2">CO2-Einsparung</Heading>
              <p className="text-sm text-muted-foreground mb-2">
                Pro wiederverwendetem Gerät werden durchschnittlich <strong>285 kg CO2</strong> eingespart.
                Diese Zahl basiert auf Studien zur Herstellungsenergie von Elektronikgeräten.
              </p>
              <code className="text-xs bg-surface-raised p-2 rounded-sm block">
                CO2 = Geräte × 285 kg
              </code>
            </div>
            <div>
              <Heading level={4} className="font-medium mb-2">Rohstoffeinsparung</Heading>
              <p className="text-sm text-muted-foreground mb-2">
                Die Wiederverwendung von Hardware spart wertvolle Rohstoffe wie Seltene Erden,
                Kupfer und andere Metalle, die sonst neu abgebaut werden müssten.
              </p>
              <code className="text-xs bg-surface-raised p-2 rounded-sm block">
                Rohstoffe = Gewichtsmessung Geräte
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

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
              { number: 4, name: 'Hochwertige Bildung', description: 'Workshops und Schulungen' },
              { number: 8, name: 'Menschenwürdige Arbeit', description: 'Arbeitsintegration' },
              { number: 12, name: 'Nachhaltiger Konsum', description: 'Hardware-Wiederverwendung' },
              { number: 13, name: 'Klimaschutz', description: 'CO2-Einsparung' },
            ].map(sdg => (
              <div
                key={sdg.number}
                className="p-4 bg-surface-raised rounded-lg text-center"
              >
                <div className="text-2xl font-bold text-primary">SDG {sdg.number}</div>
                <div className="text-sm font-medium mt-1">{sdg.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{sdg.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Collection Note */}
      <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg text-sm">
        <Heading level={4} className="font-medium text-warning-800 dark:text-warning-200 mb-2">
          Datenerfassung erforderlich
        </Heading>
        <p className="text-warning-700 dark:text-warning-300">
          Um die Wirkung vollständig zu erfassen, benötigen wir regelmässige Daten aus dem operativen Betrieb.
          Die verantwortlichen Teams sollten quartalsweise folgende Daten liefern:
        </p>
        <ul className="mt-2 space-y-1 text-warning-700 dark:text-warning-300">
          <li>• <strong>Operations:</strong> Anzahl verarbeiteter Geräte, Gewichtsmessungen</li>
          <li>• <strong>Bildung:</strong> Workshop-Teilnehmer, Schulungsstunden</li>
          <li>• <strong>HR:</strong> Integrationen, Freiwilligenstunden</li>
        </ul>
      </div>
    </div>
  )
}
