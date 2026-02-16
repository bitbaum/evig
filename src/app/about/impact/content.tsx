'use client'

import { useState } from 'react'
import Image from 'next/image'
import { HeroBanner } from '@/components/ui/hero-banner'
import AboutSubNav from '@/components/about/AboutSubNav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IMPACT_METRICS, getEnvironmentalSummary, getSocialSummary, type ImpactMetric } from '@/data/impact-metrics'
import { getDefaultValue, getDefaultNumeric } from '@/lib/org-numbers.defaults'
// Simple Badge component replacement
const Badge = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
)

// Simple Tabs replacement using state
const SimpleTabs = ({
  tabs,
  defaultValue,
  children
}: {
  tabs: { value: string, label: string, icon?: React.ReactNode }[],
  defaultValue: string,
  children: (value: string) => React.ReactNode
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <div className="w-full">
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
              activeTab === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {children(activeTab)}
      </div>
    </div>
  )
}
import {
  Heart,
  Leaf,
  Users,
  TrendingUp,
  Award,
  Target,
  CheckCircle,
  ArrowRight,
  Download,
  Calendar,
  MapPin
} from 'lucide-react'
import {
  EWasteProblemSection,
  ZeroWasteSolutionSection,
  CommunitySpaceSection
} from '@/components/impact'

interface DonationMethod {
  id: string
  name: string
  description: string
  amount?: string
  icon: React.ReactNode
  benefits: string[]
  ctaText: string
  popular?: boolean
}

export default function ImpactPageContent() {
  const [selectedDonationMethod, setSelectedDonationMethod] = useState<string | null>(null)
  const envSummary = getEnvironmentalSummary()
  const socialSummary = getSocialSummary()

  const donationMethods: DonationMethod[] = [
    {
      id: 'monthly',
      name: 'Monatliche Spende',
      description: 'Regelmässige Unterstützung für nachhaltige Wirkung',
      amount: 'Ab CHF 20/Monat',
      icon: <Heart className="h-6 w-6" />,
      benefits: [
        'Kontinuierliche Finanzierung unserer Programme',
        'Planbare Ressourcen für langfristige Projekte',
        'Exklusive Updates über unsere Wirkung',
        'Einladungen zu besonderen Veranstaltungen'
      ],
      ctaText: 'Monatlich spenden',
      popular: true
    },
    {
      id: 'one-time',
      name: 'Einmalige Spende',
      description: 'Direkte Unterstützung für spezifische Projekte',
      amount: 'Frei wählbar',
      icon: <Target className="h-6 w-6" />,
      benefits: [
        'Sofortige Wirkung für laufende Projekte',
        'Flexibilität bei der Spendenhöhe',
        'Spendenbescheinigung für Steuerzwecke',
        'Möglichkeit zur Projektbindung'
      ],
      ctaText: 'Jetzt spenden'
    },
    {
      id: 'corporate',
      name: 'Unternehmenspartnerschaft',
      description: 'Strategische Partnerschaft für nachhaltige IT',
      amount: 'Ab CHF 5000/Jahr',
      icon: <Award className="h-6 w-6" />,
      benefits: [
        'Nachhaltigkeitsbericht für Ihr Unternehmen',
        'Mitarbeiter-Workshops zu nachhaltiger IT',
        'Logo-Platzierung auf unserer Website',
        'Jährlicher Impact-Report'
      ],
      ctaText: 'Partner werden'
    },
    {
      id: 'equipment',
      name: 'Geräte-Spende',
      description: 'Spenden Sie funktionsfähige IT-Geräte',
      icon: <Leaf className="h-6 w-6" />,
      benefits: [
        'Steuerliche Absetzbarkeit der Geräte',
        'Professionelle Datenlöschung garantiert',
        'Nachhaltigkeitszertifikat für Ihr Unternehmen',
        'Sichtbare Wirkung durch Geräte-Tracking'
      ],
      ctaText: 'Geräte spenden'
    }
  ]

  const getCategoryIcon = (category: ImpactMetric['category']) => {
    switch (category) {
      case 'environmental': return <Leaf className="h-5 w-5 text-green-600" />
      case 'social': return <Users className="h-5 w-5 text-blue-600" />
      case 'economic': return <TrendingUp className="h-5 w-5 text-purple-600" />
    }
  }

  const getCategoryColor = (category: ImpactMetric['category']) => {
    switch (category) {
      case 'environmental': return 'bg-green-50 border-green-200'
      case 'social': return 'bg-blue-50 border-blue-200'
      case 'economic': return 'bg-purple-50 border-purple-200'
    }
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroBanner
        title="Unsere messbare Wirkung"
        description="Entdecken Sie, wie RevampIT seit 2003 die Schweizer IT-Landschaft nachhaltig verändert – transparent, messbar und wirksam."
      />

      {/* Sub Navigation */}
      <AboutSubNav />

      {/* E-Waste Problem Section */}
      <EWasteProblemSection />

      {/* Zero-Waste Solution Section */}
      <ZeroWasteSolutionSection />

      {/* Community Space Section */}
      <CommunitySpaceSection />

      {/* Impact Overview */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Warum Transparenz wichtig ist</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Als gemeinnütziger Verein legen wir grössten Wert auf Transparenz. Jede unserer Zahlen ist nachvollziehbar dokumentiert,
            damit Sie als Spender:in genau verstehen, wie Ihre Unterstützung wirkt.
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {IMPACT_METRICS.map((metric) => (
            <Card key={metric.id} className={`${getCategoryColor(metric.category)} border-2`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  {getCategoryIcon(metric.category)}
                  {metric.verified && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verifiziert
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl font-bold">{metric.value}</CardTitle>
                <CardDescription className="font-medium">{metric.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">{metric.description}</p>
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer font-medium mb-2">Methodik & Berechnung</summary>
                  <p className="mb-2">{metric.methodology}</p>
                  <p className="text-gray-400">Letzte Aktualisierung: {metric.lastUpdated}</p>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Impact Stories */}
        <div className="bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">Wirkung in Zahlen verstehen</h3>
          <SimpleTabs
            defaultValue="environmental"
            tabs={[
              { value: 'environmental', label: 'Umwelt', icon: <Leaf className="h-4 w-4" /> },
              { value: 'social', label: 'Sozial', icon: <Users className="h-4 w-4" /> },
              { value: 'economic', label: 'Wirtschaftlich', icon: <TrendingUp className="h-4 w-4" /> }
            ]}
          >
            {(activeTab) => (
              <>
                {activeTab === 'environmental' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Umweltwirkung im Detail</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Jedes gerettete Gerät spart durchschnittlich {envSummary.co2PerDevice}kg CO₂-Emissionen</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Wir vermeiden {envSummary.ewastePreventedTons.toFixed(1)} Tonnen Elektronikschrott pro Jahr</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{Math.round(envSummary.reuseRate * 100)}% unserer Geräte werden wiederverwendet statt recycelt</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-white p-6 rounded-lg">
                      <h5 className="font-semibold mb-3">Vergleich mit Neugeräten</h5>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Herstellung eines neuen Laptops:</span>
                          <span className="font-semibold">{envSummary.co2ProductionKg}kg CO₂</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Refurbishment eines Geräts:</span>
                          <span className="font-semibold text-green-600">{envSummary.co2RefurbishmentKg}kg CO₂</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>CO₂-Einsparung pro Gerät:</span>
                          <span className="font-semibold text-green-600">{envSummary.co2PerDevice}kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'social' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Soziale Wirkung im Detail</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>~{Math.round(socialSummary.internshipSuccessRate * 100)}% unserer Praktikant:innen finden IT-Jobs oder Weiterbildung</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>~{socialSummary.careerReentries} berufliche Wiedereinstiege pro Jahr durch unser Programm</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>{getDefaultValue('people_helped_total')} Menschen in nachhaltiger IT begleitet seit 2003</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-white p-6 rounded-lg">
                      <h5 className="font-semibold mb-3">Erfolgsgeschichten</h5>
                      <div className="space-y-3 text-sm">
                        <p>"Dank RevampIT habe ich nach 3 Jahren Arbeitslosigkeit wieder Fuss gefasst in der IT-Branche."</p>
                        <p className="text-gray-500">- Sarah M., ehemalige Praktikantin</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'economic' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Wirtschaftliche Wirkung</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>Kunden sparen durchschnittlich CHF {getDefaultNumeric('customer_savings_chf')} pro repariertem Gerät</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>KMU profitieren von günstigen Open Source-Lösungen</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>{getDefaultValue('team_size_community')} sinnvolle Arbeitsplätze in der Schweiz</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-white p-6 rounded-lg">
                      <h5 className="font-semibold mb-3">Wirtschaftlicher Impact</h5>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Durchschnittliche Reparaturkosten:</span>
                          <span className="font-semibold">CHF {getDefaultNumeric('avg_repair_cost_chf')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Neugerät-Preis (vergleichbar):</span>
                          <span className="font-semibold">CHF {getDefaultNumeric('new_device_comparison_chf')}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>Einsparung pro Kunde:</span>
                          <span className="font-semibold text-green-600">CHF {getDefaultNumeric('customer_savings_chf')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </SimpleTabs>
        </div>
      </section>

      {/* Donation Methods */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Wie Sie uns unterstützen können</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Jede Unterstützung zählt und trägt direkt zu unserer Mission bei. Wählen Sie die für Sie passende Art der Unterstützung.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {donationMethods.map((method) => (
              <Card
                key={method.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  method.popular ? 'ring-2 ring-green-500 bg-green-50' : ''
                }`}
                onClick={() => setSelectedDonationMethod(method.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {method.icon}
                      <CardTitle className="text-xl">{method.name}</CardTitle>
                    </div>
                    {method.popular && (
                      <Badge className="bg-green-600 text-white">Beliebt</Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">{method.description}</CardDescription>
                  {method.amount && (
                    <p className="text-sm font-medium text-green-600">{method.amount}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {method.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={method.popular ? "default" : "outline"}>
                    {method.ctaText}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Donation Impact Calculator */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-center">Ihre Spenden-Wirkung berechnen</CardTitle>
              <CardDescription className="text-center">
                Sehen Sie sofort, welche Wirkung Ihre Spende haben kann
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">CHF {getDefaultNumeric('donation_impact_laptop_chf')}</p>
                  <p className="text-sm text-gray-600">Reparatur eines Laptops für eine Familie</p>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">CHF {getDefaultNumeric('donation_impact_internship_chf')}</p>
                  <p className="text-sm text-gray-600">Ein Monat Praktikumsstelle für Wiedereinsteiger:in</p>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">CHF {getDefaultNumeric('donation_impact_data_recovery_chf')}</p>
                  <p className="text-sm text-gray-600">Vollständige Datenrettung für KMU-Kunde</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Transparency & Reports */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Transparenz & Berichterstattung</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Wir berichten regelmässig über unsere Aktivitäten und Wirkung. Alle Dokumente sind öffentlich zugänglich.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Jahresbericht 2023
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Vollständiger Tätigkeitsbericht mit allen Kennzahlen und Aktivitäten des Jahres 2023.
              </p>
              <Button variant="outline" className="w-full">
                PDF herunterladen
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Wirkungsbericht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Detaillierte Analyse unserer sozialen und ökologischen Wirkung mit Methodik-Erläuterungen.
              </p>
              <Button variant="outline" className="w-full">
                Bericht ansehen
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Transparenz-Register
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Öffentliches Register aller Spenden und wie diese verwendet wurden.
              </p>
              <Button variant="outline" className="w-full">
                Register öffnen
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6">Gemeinsam mehr erreichen</h2>
          <p className="text-xl mb-8">
            Ihre Unterstützung macht den Unterschied. Jeder Beitrag, ob gross oder klein, hilft uns dabei,
            die Schweizer IT-Landschaft nachhaltiger zu gestalten und Menschen neue Chancen zu geben.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
              Jetzt spenden
              <Heart className="h-5 w-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline-light">
              Kontakt aufnehmen
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
