import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar, Cloud, Server, Zap, Shield, Globe, Clock, AlertTriangle, Heart } from 'lucide-react'

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
              'name': 'RevampIT',
              'url': 'https://revampit.org'
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
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="container mx-auto px-4 sm:px-6 relative">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-red-100 text-red-800">
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Derzeit nicht im Angebot
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">Cloud-Infrastruktur</h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-green-200">Zukunftsvision: Nachhaltige Cloud für das Gemeinwohl</h2>
              <p className="text-xl text-green-100 mb-8">
                <strong>Dieser Service ist derzeit nicht verfügbar.</strong> Als missionsgetriebene, sich selbst tragende gemeinnützige Organisation
                stellen wir uns vor, eine ethische Cloud-Infrastruktur aufzubauen, die Gemeinschaften dient und gleichzeitig unseren Planeten schützt.
              </p>
              
              <div className="bg-red-900/50 border border-red-600 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-300 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-100 mb-2">Dienstleistung nicht verfügbar</h3>
                    <p className="text-red-200">
                      Wir bieten derzeit keine Cloud-Infrastrukturdienste an. Diese Seite repräsentiert unsere langfristige Vision,
                      während wir nachhaltige Kapazitäten aufbauen, um die digitalen Bedürfnisse unserer Gemeinschaft zu erfüllen.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-800/50 border border-green-600 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-6 h-6 text-green-300 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-100 mb-2">Visions-Zeitplan: 2026-2028</h3>
                    <p className="text-green-200">
                      Durch Gemeinschaftspartnerschaften und nachhaltiges Wachstum streben wir an, eine wirklich ethische Cloud-Infrastruktur
                      zu entwickeln, die ökologische Verantwortung und digitale Gerechtigkeit in den Vordergrund stellt.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

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