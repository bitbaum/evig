import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar, Cpu, Wifi, Zap, Layers, Smartphone, Clock, AlertTriangle, Heart } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'

export const metadata: Metadata = {
  title: 'IoT-Lösungen - Zukunftsvision | RevampIT',
  description: 'Unsere Vision für ethische IoT-Entwicklung mit Open-Source-Hardware. Teil unserer langfristigen Mission als gemeinnützige Organisation. Derzeit nicht angeboten - angestrebt für 2026-2028.',
  openGraph: {
    title: 'IoT-Lösungen - Zukunftsvision | RevampIT',
    description: 'Unsere Vision für ethische IoT-Entwicklung mit Open-Source-Hardware. Teil unserer langfristigen Mission als gemeinnützige Organisation. Derzeit nicht angeboten - angestrebt für 2026-2028.',
    type: 'website',
  },
}

export default function IoTSolutionsPage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'IoT-Lösungen - Zukunftsvision',
            'description': 'Ethische IoT-Entwicklungsvision für 2026-2028',
            'provider': {
              '@type': 'Organization',
              'name': 'Revamp-IT',
              'url': 'https://revamp-it.ch'
            },
            'serviceType': 'IoT-Lösungen',
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
          icon={Cpu}
          title="IoT-Lösungen"
          subtitle="Zukunftsvision: Ethisches IoT für das Gemeinwohl. Als missionsgetriebene gemeinnützige Organisation stellen wir uns vor, IoT-Lösungen zu schaffen, die Gemeinschaften stärken und gleichzeitig Privatsphäre und Umwelt schützen."
        >
          <div className="mt-6 space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Derzeit nicht im Angebot
            </div>

            <div className="bg-white/90 border border-red-200 rounded-lg p-4">
              <p className="text-gray-700 text-sm">
                <strong>Dieser Service ist derzeit nicht verfügbar.</strong> Dies repräsentiert unsere langfristige Vision für die Schaffung von Technologie, die den Menschen und dem Planeten dient.
              </p>
            </div>

            <div className="bg-white/90 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700 text-sm">
                  <strong>Visions-Zeitplan: 2026-2028</strong> - Durch Zusammenarbeit mit der Gemeinschaft und nachhaltige Entwicklungspraktiken streben wir an, transparente IoT-Lösungen zu schaffen.
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
                <h2 className="text-4xl font-bold text-gray-900">IoT für das soziale Wohl</h2>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Unsere zukünftigen IoT-Lösungen werden die Stärkung der Gemeinschaft, die Umweltüberwachung
                und die digitale Souveränität über Überwachung und Datenextraktion stellen.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Heart,
                  title: 'Gemeinschaftlich kontrollierte Daten',
                  description: 'Lokale Dateneigentümerschaft und -verarbeitung zum Schutz der Privatsphäre der Gemeinschaft'
                },
                {
                  icon: Cpu,
                  title: 'Open-Source-Hardware',
                  description: 'Transparente, modifizierbare Designs, die Gemeinschaften verstehen und reparieren können'
                },
                {
                  icon: Zap,
                  title: 'Umweltüberwachung',
                  description: 'Hilft Gemeinschaften, Umweltveränderungen zu verfolgen und darauf zu reagieren'
                },
                {
                  icon: Wifi,
                  title: 'Genossenschaftliche Netzwerke',
                  description: 'Gemeinschaftseigene Mesh-Netzwerke für digitale Unabhängigkeit'
                },
                {
                  icon: Layers,
                  title: 'Recht auf Reparatur',
                  description: 'Designs, die Reparierbarkeit und langfristige Nachhaltigkeit priorisieren'
                },
                {
                  icon: Smartphone,
                  title: 'Digitale Kompetenz',
                  description: 'Bildungskomponenten zum Aufbau technischer Kapazitäten in Gemeinschaften'
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
              <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Ethische Entwicklung braucht Zeit</h2>
              <div className="bg-gray-50 rounded-xl p-8 border">
                <p className="text-lg text-gray-700 mb-6">
                  Im Gegensatz zu gewinnorientierten IoT-Unternehmen, die eine schnelle Bereitstellung und Datenerfassung priorisieren,
                  verpflichten wir uns zu einer verantwortungsvollen Entwicklung, die die langfristigen Auswirkungen auf die Gemeinschaft berücksichtigt:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Konsultation der Gemeinschaft</h4>
                        <p className="text-gray-600">Umfassendes Engagement, um die tatsächlichen Bedürfnisse und Anliegen der Gemeinschaft zu verstehen</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Datenschutzfreundliches Design</h4>
                        <p className="text-gray-600">Entwicklung von Systemen, die Benutzerdaten schützen statt ausnutzen</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Nachhaltige Lieferketten</h4>
                        <p className="text-gray-600">Erforschung ethischer Beschaffung und Ansätze der Kreislaufwirtschaft</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Open-Source-Entwicklung</h4>
                        <p className="text-gray-600">Aufbau kollaborativer Entwicklungsprozesse mit Transparenz</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community Applications */}
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Gemeinschaftszentrierte Anwendungen</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Wenn wir bereit sind, werden unsere IoT-Lösungen echte Herausforderungen der Gemeinschaft angehen,
                anstatt neue Formen der Überwachung oder Abhängigkeit zu schaffen.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: 'Gemeinschaftliche Umweltüberwachung',
                  description: 'Bürgerwissenschaftsnetzwerke zur Verfolgung der Luftqualität, der Wassergesundheit und der Klimaauswirkungen',
                  applications: ['Gemeinschaftseigene Sensoren', 'Offene Datenplattformen', 'Frühwarnsysteme', 'Dokumentation zur Umweltgerechtigkeit']
                },
                {
                  title: 'Genossenschaftliche Infrastruktur',
                  description: 'Gemeinsame Technologieinfrastruktur, die Kosten senkt und die Kontrolle der Gemeinschaft erhöht',
                  applications: ['Gemeinschaftliche Mesh-Netzwerke', 'Gemeinsame Überwachungssysteme', 'Kollektives Ressourcenmanagement', 'Demokratische Governance-Tools']
                },
                {
                  title: 'Unterstützung für Ältere und Behinderte',
                  description: 'Datenschutzfreundliche Hilfstechnologie, die befähigt statt überwacht',
                  applications: ['Persönliche Sicherheitswarnungen', 'Gesundheitsüberwachung', 'Tools zur Gemeinschaftsverbindung', 'Barrierefreiheitsverbesserungen']
                },
                {
                  title: 'Urbane Gärten & Ernährungssicherheit',
                  description: 'Unterstützung gemeinschaftlicher Lebensmittelsysteme mit angemessener Technologie',
                  applications: ['Überwachung von Gemeinschaftsgärten', 'Plattformen zum Teilen von Ressourcen', 'Erntekoordination', 'Verfolgung der Bodengesundheit']
                }
              ].map((useCase, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                  <p className="text-gray-600 mb-6">{useCase.description}</p>
                  <div className="space-y-2">
                    {useCase.applications.map((app, appIndex) => (
                      <div key={appIndex} className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                        {app}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Community Involvement */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Gestalten Sie unsere Forschung mit</h2>
              <p className="text-xl text-gray-600 mb-8">
                Helfen Sie uns bei der Erforschung und Entwicklung von IoT-Lösungen, die wirklich den Bedürfnissen der Gemeinschaft dienen.
                Ihr Beitrag ist für eine ethische Technologieentwicklung unerlässlich.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-green-800 mb-4">Forschungspartnerschaft mit der Gemeinschaft</h3>
                <p className="text-green-700 mb-6">
                  Nehmen Sie an unserem Forschungsprozess teil, um zu untersuchen, wie die IoT-Technologie Ihre Gemeinschaft unterstützen kann,
                  ohne die Privatsphäre oder Autonomie zu beeinträchtigen. Wir brauchen vielfältige Stimmen, um bessere Lösungen zu entwickeln.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">Gemeinschaft</div>
                    <div className="text-green-700">Geführter Designprozess</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">Offen</div>
                    <div className="text-green-700">Alles Open Source</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">Privatsphäre</div>
                    <div className="text-green-700">Datenschutzfreundliche Architektur</div>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 text-lg"
                >
                  Treten Sie der Forschungsgemeinschaft bei
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Current Services CTA */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Benötigen Sie heute technische Unterstützung?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
              Während wir unsere IoT-Vision entwickeln, unterstützen wir aktiv Gemeinschaften mit
              Open-Source-Lösungen und der Wiederaufbereitung von Hardware.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services/open-source-solutions"
                className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                Open-Source-Lösungen
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