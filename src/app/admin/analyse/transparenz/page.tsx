/**
 * Admin Analyse Transparenz Page
 *
 * First Principles analysis and methodology transparency.
 * Protected by role-based access control.
 *
 * Moved from /admin/hirn/transparenz
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import Link from 'next/link'
import { ArrowLeft, Eye, FileText, Database, GitBranch } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AnalyseTabs } from '@/components/analyse'
import Heading from '@/components/admin/AdminHeading'
import { ROUTES } from '@/config/routes'

export default async function TransparenzPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/analyse/transparenz')
  }

  // Check permission for transparenz section
  const hasAccess = canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'transparenz') || canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'hirn')

  if (!hasAccess) {
    redirect('/admin?error=no_transparenz_access')
  }

  const principles = [
    {
      title: 'Single Source of Truth (SSOT)',
      description: 'Jede Information hat genau eine kanonische Quelle. Alle anderen Darstellungen sind abgeleitet.',
      examples: [
        'Finanzdaten: Kivitendo-Export als JSON',
        'KPIs: CSV-Dateien in strukturiertem Format',
        'Dokumentation: Markdown mit YAML-Metadaten',
      ],
    },
    {
      title: 'First Principles',
      description: 'Jeder Bereich definiert sein Ziel, Constraints, Invarianten und Abhängigkeiten.',
      examples: [
        'Ziel: Was optimieren wir?',
        'Constraints: Rechtlich, Kapazität, Budget',
        'Invarianten: Nicht verhandelbar (Privacy, FOSS-first)',
      ],
    },
    {
      title: 'Traceability',
      description: 'Jeder angezeigte Wert kann zu seiner Quelle zurückverfolgt werden.',
      examples: [
        'Kontonummer aus Buchhaltung',
        'Importzeitpunkt',
        'Berechnungsformel bei abgeleiteten Werten',
      ],
    },
  ]

  const dataSources = [
    {
      name: 'Kivitendo',
      type: 'Buchhaltung',
      format: 'JSON Export',
      updateFrequency: 'Monatlich',
    },
    {
      name: 'KPI Framework',
      type: 'Kennzahlen',
      format: 'CSV',
      updateFrequency: 'Quartalsweise',
    },
    {
      name: 'Hirn Wissensbasis',
      type: 'Dokumentation',
      format: 'Markdown + YAML',
      updateFrequency: 'Kontinuierlich',
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
          <div className="p-2 bg-secondary-100 rounded-lg">
            <Eye className="w-6 h-6 text-secondary-600" />
          </div>
          <div>
            <Heading level={1} className="text-3xl font-bold">Transparenz</Heading>
            <p className="text-muted-foreground">
              First Principles und Methodologie
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <AnalyseTabs />

      {/* Philosophy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Hirn-Methodologie
          </CardTitle>
          <CardDescription>
            Das Hirn ist eine strukturierte Wissensbasis für Menschen und AI-Agenten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Statt Probleme durch Analogie zu lösen (&quot;so haben wir es immer gemacht&quot;),
            zerlegen wir sie in ihre fundamentalen Bestandteile und bauen von dort neu auf.
          </p>
          <div className="p-4 bg-surface-raised dark:bg-neutral-800/50 border-l-4 border-neutral-400 rounded">
            <p className="text-sm italic">
              &quot;Vom Grundprinzip zur Lösung – für Menschen und AI.&quot;
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Principles */}
      <div className="grid md:grid-cols-3 gap-6">
        {principles.map(principle => (
          <Card key={principle.title}>
            <CardHeader>
              <CardTitle className="text-lg">{principle.title}</CardTitle>
              <CardDescription>{principle.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {principle.examples.map((example, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    {example}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Datenquellen
          </CardTitle>
          <CardDescription>
            Alle im Hirn verwendeten Datenquellen mit Update-Frequenz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Quelle</th>
                  <th className="text-left py-2 px-4 font-medium">Typ</th>
                  <th className="text-left py-2 px-4 font-medium">Format</th>
                  <th className="text-left py-2 px-4 font-medium">Aktualisierung</th>
                </tr>
              </thead>
              <tbody>
                {dataSources.map(source => (
                  <tr key={source.name} className="border-b">
                    <td className="py-2 px-4 font-medium">{source.name}</td>
                    <td className="py-2 px-4 text-muted-foreground">{source.type}</td>
                    <td className="py-2 px-4">
                      <code className="bg-surface-raised dark:bg-neutral-900 px-2 py-1 rounded text-sm">
                        {source.format}
                      </code>
                    </td>
                    <td className="py-2 px-4 text-muted-foreground">{source.updateFrequency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dokumentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Die vollständige Hirn-Dokumentation befindet sich im <code className="bg-surface-raised dark:bg-neutral-900 px-2 py-1 rounded">docs/hirn/</code> Verzeichnis
            und enthält:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-primary-500">✓</span>
              CLAUDE.md – Entwicklungsrichtlinien für AI-Agenten
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-500">✓</span>
              Knowledge Graph und Glossar
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-500">✓</span>
              First Principles Templates für neue Bereiche
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
