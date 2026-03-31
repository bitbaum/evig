import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar, Cloud, Server, Zap, Shield, Globe, Clock, AlertTriangle, Heart } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'

export const metadata: Metadata = {
  title: 'Cloud-Infrastruktur - Zukunftsvision | RevampIT',
  description: 'Unsere Vision für nachhaltiges Cloud-Hosting. Teil unserer langfristigen Mission als gemeinnützige Organisation. Derzeit nicht angeboten - angestrebt für 2026-2028.',
  openGraph: {
    title: 'Cloud-Infrastruktur - Zukunftsvision | RevampIT',
    description: 'Unsere Vision für nachhaltiges Cloud-Hosting. Teil unserer langfristigen Mission als gemeinnützige Organisation. Derzeit nicht angeboten - angestrebt für 2026-2028.',
    type: 'website',
  },
}

export default function CloudInfrastructurePage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Cloud-Infrastruktur - Zukunftsvision',
            'description': 'Nachhaltige Cloud-Hosting-Vision für 2026-2028',
            'provider': {
              '@type': 'Organization',
              'name': 'Revamp-IT',
              'url': 'https://revamp-it.ch'
            },
            'serviceType': 'Cloud-Infrastruktur',
            'areaServed': {
              '@type': 'Country',
              'name': 'Switzerland'
            },
            'availability': 'FutureVision'
          })
        }}
      />
      
      <main className="min-h-screen bg-gray-50">
        <PageHero
          theme="services"
          icon={Cloud}
          title="Cloud-Infrastruktur"
          subtitle="Zukunftsvision: Nachhaltige Cloud für das Gemeinwohl. Als missionsgetriebene gemeinnützige Organisation stellen wir uns vor, eine ethische Cloud-Infrastruktur aufzubauen, die Gemeinschaften dient und gleichzeitig unseren Planeten schützt."
        >
          <div className="mt-6 space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Derzeit nicht im Angebot
            </div>

            <div className="bg-white/90 border border-red-200 rounded-lg p-4">
              <p className="text-gray-700 text-sm">
                <strong>Dieser Service ist derzeit nicht verfügbar.</strong> Diese Seite repräsentiert unsere langfristige Vision,
                während wir nachhaltige Kapazitäten aufbauen.
              </p>
            </div>

            <div className="bg-white/90 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700 text-sm">
                  <strong>Visions-Zeitplan: 2026-2028</strong> - Durch Gemeinschaftspartnerschaften und nachhaltiges Wachstum streben wir an, eine wirklich ethische Cloud-Infrastruktur zu entwickeln.
                </p>
              </div>
            </div>
          </div>
        </PageHero>

        {/* Mission Alignment Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Heart className="w-8 h-8 text-green-600" />
                <h2 className="text-4xl font-bold text-gray-900">Missionsgetriebene Technologie</h2>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Als gemeinnützige Organisation wird unsere zukünftige Cloud-Infrastruktur auf den Prinzipien der
                Nachhaltigkeit, der Stärkung der Gemeinschaft und der digitalen Gerechtigkeit aufgebaut sein.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Heart,
                  title: 'Gemeinschaft zuerst',
                  description: 'Entwickelt, um unterversorgten Gemeinschaften zu dienen und die digitale Inklusion zu fördern'
                },
                {
                  icon: Zap,
                  title: '100% erneuerbare Energie',
                  description: 'Vollständig mit sauberer, erneuerbarer Energie betrieben, mit CO2-negativen Zielen'
                },
                {
                  icon: Globe,
                  title: 'Open-Source-Grundlage',
                  description: 'Aufgebaut auf Open-Source-Technologien, um Transparenz und gemeinschaftliches Eigentum zu gewährleisten'
                },
                {
                  icon: Shield,
                  title: 'Datenschutz durch Design',
                  description: 'Datenschutzfreundliche Architektur, die Benutzerdaten und digitale Rechte schützt'
                },
                {
                  icon: Server,
                  title: 'Genossenschaftsmodell',
                  description: 'Gemeinschaftseigene Infrastruktur zur Unterstützung der lokalen digitalen Souveränität'
                },
                {
                  icon: Cloud,
                  title: 'Kreislaufwirtschaft',
                  description: 'Verwendung von wiederaufbereiteter Hardware und Förderung nachhaltiger Technologie-Lebenszyklen'
                }
              ].map((feature, index) => (
                <div key={index} className="bg-green-50 rounded-xl p-6 shadow-lg border-l-4 border-green-600">
                  <div className="flex items-start mb-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Not Now Section */}
        <section className="py-12 sm:py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Warum wir noch nicht bereit sind</h2>
              <div className="bg-gray-50 rounded-xl p-8 border">
                <p className="text-lg text-gray-700 mb-6">
                  Als missionsgetriebene gemeinnützige Organisation glauben wir daran, Technologieinfrastruktur verantwortungsvoll und nachhaltig aufzubauen.
                  Anstatt überstürzt auf den Markt zu drängen, nehmen wir uns die Zeit, um:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Gemeinschaftspartnerschaften aufzubauen</h4>
                        <p className="text-gray-600">Zusammenarbeit mit lokalen Organisationen und Gemeinschaften, um echte Bedürfnisse zu verstehen</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Finanzielle Nachhaltigkeit sicherzustellen</h4>
                        <p className="text-gray-600">Entwicklung eines sich selbst tragenden Modells, das unsere Mission nicht gefährdet</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Nachhaltige Technologien zu erforschen</h4>
                        <p className="text-gray-600">Identifizierung und Erprobung der umweltverträglichsten Lösungen</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Unser Team zu schulen</h4>
                        <p className="text-gray-600">Aufbau interner Expertise bei gleichzeitiger Schaffung sinnvoller Beschäftigungsmöglichkeiten</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Get Involved Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Gestalten Sie unsere Vision mit</h2>
              <p className="text-xl text-gray-600 mb-8">
                Möchten Sie Teil des Aufbaus einer ethischen, nachhaltigen Cloud-Infrastruktur sein?
                Treten Sie unserer Gemeinschaft bei und helfen Sie uns, für die Zukunft zu planen.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-green-800 mb-4">Gemeinschaftlicher Input benötigt</h3>
                <p className="text-green-700 mb-6">
                  Teilen Sie Ihre Gedanken zu nachhaltiger Cloud-Infrastruktur und helfen Sie uns, die Bedürfnisse der Gemeinschaft zu verstehen.
                  Ihr Beitrag wird unsere Entwicklungs-Roadmap direkt beeinflussen.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 text-lg"
                >
                  Teilen Sie Ihre Vision
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Current Services CTA */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Benötigen Sie heute technische Hilfe?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
              Während wir unsere langfristige Vision entwickeln, unterstützen wir unsere Gemeinschaft aktiv mit diesen Dienstleistungen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services"
                className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                Aktuelle Dienstleistungen anzeigen
              </Link>
              <Link
                href="/get-involved"
                className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
              >
                Machen Sie mit
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}