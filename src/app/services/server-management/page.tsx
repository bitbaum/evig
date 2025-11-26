import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar, Server, Database, Monitor, Shield, Settings, Clock, AlertTriangle, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Server-Management - Zukunftsvision | RevampIT',
  description: 'Unsere Vision für ethische Server-Management-Dienstleistungen. Teil unserer langfristigen Mission als gemeinnützige Organisation. Derzeit nicht angeboten - angestrebt für 2026-2028.',
  openGraph: {
    title: 'Server-Management - Zukunftsvision | RevampIT',
    description: 'Unsere Vision für ethische Server-Management-Dienstleistungen. Teil unserer langfristigen Mission als gemeinnützige Organisation. Derzeit nicht angeboten - angestrebt für 2026-2028.',
    type: 'website',
  },
}

export default function ServerManagementPage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Server-Management - Zukunftsvision',
            'description': 'Ethische Server-Management-Vision für 2026-2028',
            'provider': {
              '@type': 'Organization',
              'name': 'RevampIT',
              'url': 'https://revampit.org'
            },
            'serviceType': 'Server-Management',
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
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">Server-Management</h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-green-200">Zukunftsvision: Ethisches Infrastruktur-Management</h2>
              <p className="text-xl text-green-100 mb-8">
                <strong>Dieser Service ist derzeit nicht verfügbar.</strong> Als missionsgetriebene, sich selbst tragende gemeinnützige Organisation
                stellen wir uns vor, Server-Management-Dienstleistungen anzubieten, die die Bedürfnisse der Gemeinschaft und die ökologische Verantwortung in den Vordergrund stellen.
              </p>
              
              <div className="bg-red-900/50 border border-red-600 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-300 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-100 mb-2">Dienstleistung nicht verfügbar</h3>
                    <p className="text-red-200">
                      Wir bieten derzeit keine Server-Management-Dienstleistungen an. Dies repräsentiert unsere langfristige Vision
                      zur nachhaltigen Unterstützung der Technologieinfrastruktur der Gemeinschaft.
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
                      Durch sorgfältigen Kapazitätsaufbau und Gemeinschaftspartnerschaften streben wir an, ethisches
                      Server-Management anzubieten, das dem sozialen Wohl statt dem reinen Profit dient.
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
                <h2 className="text-4xl font-bold text-gray-900">Gemeinschaftszentrierte Infrastruktur</h2>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Unser zukünftiges Server-Management wird gemeinnützige Organisationen, Genossenschaften
                und missionsgetriebene Unternehmen priorisieren, die sich traditionelle Unternehmenslösungen nicht leisten können.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Heart,
                  title: 'Missionsgetriebene Kunden zuerst',
                  description: 'Vorrangige Unterstützung für gemeinnützige Organisationen, Genossenschaften und Gemeinschaftsgruppen'
                },
                {
                  icon: Server,
                  title: 'Fokus auf wiederaufbereitete Hardware',
                  description: 'Verlängerung der Lebensdauer von Servern durch fachmännische Wiederaufbereitung und Optimierung'
                },
                {
                  icon: Shield,
                  title: 'Datenschutz & Sicherheit als Standard',
                  description: 'Schutz von Gemeinschaftsdaten durch datenschutzfreundliche Sicherheitspraktiken'
                },
                {
                  icon: Settings,
                  title: 'Open-Source-Lösungen',
                  description: 'Verwendung von und Beitrag zu Open-Source-Server-Management-Tools'
                },
                {
                  icon: Monitor,
                  title: 'Transparenter Betrieb',
                  description: 'Klare Dokumentation und Wissensaustausch mit unserer Gemeinschaft'
                },
                {
                  icon: Database,
                  title: 'Preisgestaltung nach Mass',
                  description: 'Erschwingliche Preise basierend auf der Grösse der Organisation und dem sozialen Einfluss'
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
              <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Kapazitäten verantwortungsvoll aufbauen</h2>
              <div className="bg-gray-50 rounded-xl p-8 border">
                <p className="text-lg text-gray-700 mb-6">
                  Als gemeinnützige Organisation verpflichten wir uns zu nachhaltigem Wachstum, das unsere Werte nicht beeinträchtigt.
                  Wir konzentrieren uns derzeit auf:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Entwicklung interner Expertise</h4>
                        <p className="text-gray-600">Schulung unseres Teams in nachhaltigen Server-Management-Praktiken</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Bedarfsanalyse der Gemeinschaft</h4>
                        <p className="text-gray-600">Verstehen, welche Server-Management-Dienste unsere Gemeinschaft tatsächlich benötigt</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Nachhaltiges Geschäftsmodell</h4>
                        <p className="text-gray-600">Schaffung eines Preismodells, das unsere Mission unterstützt und gleichzeitig zugänglich bleibt</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Entwicklung von Partnerschaften</h4>
                        <p className="text-gray-600">Aufbau von Beziehungen zu anderen missionsgetriebenen Organisationen</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Planned Service Model */}
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Zukünftiges Dienstleistungsmodell</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Wenn wir bereit sind, wird unser Server-Management so strukturiert sein, dass es den Bedürfnissen der Gemeinschaft dient,
                nicht der Gewinnmaximierung.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Gemeinschaftsorganisationen',
                  description: 'Sondertarife für gemeinnützige Organisationen und Gemeinschaftsgruppen',
                  features: ['Preisgestaltung nach Mass', 'Grundlegendes Monitoring', 'Community-Support-Forum', 'Bildungsressourcen']
                },
                {
                  name: 'Missionsgetriebene Unternehmen',
                  description: 'Unterstützung für Sozialunternehmen und B-Corps',
                  features: ['Erschwingliche professionelle Tarife', 'Vorrangiger Support', 'Nachhaltigkeitsberichte', 'Grüne Hosting-Optionen']
                },
                {
                  name: 'Genossenschaftsmodell',
                  description: 'Gemeinsame Infrastruktur für mehrere Organisationen',
                  features: ['Geteilte Kosten und Ressourcen', 'Gemeinschaftliche Verwaltung', 'Gegenseitiges Unterstützungsnetzwerk', 'Wissensaustausch']
                }
              ].map((plan, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Get Involved Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Helfen Sie uns bei der Planung</h2>
              <p className="text-xl text-gray-600 mb-8">
                Sind Sie Teil einer Gemeinschaftsorganisation, die von ethischem Server-Management profitieren könnte?
                Helfen Sie uns zu verstehen, was Sie brauchen.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-green-800 mb-4">Planungssitzung der Gemeinschaft</h3>
                <p className="text-green-700 mb-6">
                  Teilen Sie Ihre Herausforderungen im Server-Management und helfen Sie uns, Dienstleistungen zu entwickeln, die wirklich den
                  Bedürfnissen der Gemeinschaft dienen. Ihr Beitrag ist für unseren Planungsprozess von unschätzbarem Wert.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 text-lg"
                >
                  Teilen Sie Ihre Bedürfnisse
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Current Services CTA */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Benötigen Sie heute Server-Hilfe?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
              Während wir unsere Vision für das Server-Management entwickeln, können wir bei der Linux-Installation und Open-Source-Lösungen helfen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services/linux-open-source"
                className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                Linux-Dienste
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