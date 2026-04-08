import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Recycle,
  Shield,
  Wrench,
  Package,
  Truck,
  CheckCircle2,
  Leaf,
  Award,
  MapPin,
  Phone,
  Clock
} from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { ORG, CONTACT, LOCATIONS, OPENING_HOURS } from '@/config/org'

export const metadata: Metadata = {
  title: `Hardware-Recycling | ${ORG.name}`,
  description: 'Verantwortungsvolles Recycling und Aufbereitung von IT-Geräten. Sichere Datenlöschung, kostenloser Abholservice und nachhaltige IT-Lösungen.',
  openGraph: {
    title: `Hardware-Recycling | ${ORG.name}`,
    description: 'Nachhaltige IT-Lösungen durch verantwortungsvolles Recycling und Aufbereitung von IT-Geräten.',
    type: 'website',
  },
}

const features = [
  {
    icon: Shield,
    title: 'Sichere Datenlöschung',
    description: 'Vollständige und sichere Löschung aller Daten von Geräten.'
  },
  {
    icon: Wrench,
    title: 'Geräte-Aufarbeitung',
    description: 'Professionelle Aufarbeitung von IT-Ausrüstung.'
  },
  {
    icon: Package,
    title: 'Komponenten-Recycling',
    description: 'Verantwortungsvolles Recycling elektronischer Komponenten.'
  },
  {
    icon: Truck,
    title: 'Kostenloser Abholservice',
    description: 'Bequemer Abholservice für deine alte Ausrüstung.'
  }
]

const pricingFeatures = [
  'Kostenloser Abholservice',
  'Sichere Datenlöschung',
  'Umweltverantwortlich',
  'Zertifikat der Vernichtung'
]

export default function HardwareRecyclingPage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Hardware-Recycling',
            'description': 'Verantwortungsvolles Recycling und Aufbereitung von IT-Geräten',
            'provider': {
              '@type': 'Organization',
              'name': ORG.name,
              'url': ORG.website,
            },
            'serviceType': 'IT Equipment Recycling',
            'areaServed': {
              '@type': 'City',
              'name': 'Zürich'
            },
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'CHF'
            }
          })
        }}
      />

      <main className="min-h-screen bg-gray-50">
        <PageHero
          theme="services"
          icon={Recycle}
          title="Hardware-Recycling"
          subtitle="Verantwortungsvolle Recycling- und Aufarbeitungsdienste für IT-Ausrüstung. Wir helfen dabei, Elektroschrott zu reduzieren, während wir sichere Datenlöschung gewährleisten."
        />

        {/* Features Grid */}
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <div key={index} className="bg-green-50 rounded-xl p-6 sm:p-8 shadow-lg border-l-4 border-green-600">
                  <div className="flex items-start">
                    <div className="p-2 sm:p-3 bg-green-100 rounded-lg text-green-600 mr-3 sm:mr-4">
                      <feature.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Preise</h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-600">Nachhaltig und erschwinglich</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12">
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-block bg-green-100 text-green-800 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
                    Beste Wahl
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                    Kostenlos
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">für die meisten Artikel</p>
                </div>

                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  {pricingFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/contact"
                  className="block w-full bg-green-600 text-white text-center py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 text-sm sm:text-base"
                >
                  Bereit loszulegen?
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Environmental Impact */}
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <Leaf className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 mx-auto mb-3 sm:mb-4" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Umweltverantwortung</h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-600">
                  Jedes recycelte Gerät hilft, unseren Planeten zu schützen
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center">
                <div className="bg-green-50 rounded-xl p-6 sm:p-8">
                  <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">100%</div>
                  <p className="text-sm sm:text-base text-gray-700">Sichere Datenlöschung</p>
                </div>
                <div className="bg-green-50 rounded-xl p-6 sm:p-8">
                  <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">♻️</div>
                  <p className="text-sm sm:text-base text-gray-700">Nachhaltige Prozesse</p>
                </div>
                <div className="bg-green-50 rounded-xl p-6 sm:p-8">
                  <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">🌱</div>
                  <p className="text-sm sm:text-base text-gray-700">Reduzierter E-Waste</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Kontaktiere uns heute</h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-600">
                  Um mehr über unsere Hardware-Recycling Dienstleistungen zu erfahren
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
                  <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Standorte</h3>
                  <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-600">
                    <p><strong>Verkauf:</strong><br />{LOCATIONS.store.full}</p>
                    <p><strong>Lager:</strong><br />{LOCATIONS.warehouse.full}<br />{LOCATIONS.warehouse.note}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
                  <div className="mb-4 sm:mb-6">
                    <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-3 sm:mb-4" />
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Kontakt</h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      <strong>Telefon:</strong><br />
                      {CONTACT.phone}
                    </p>
                  </div>

                  <div>
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-3 sm:mb-4" />
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Öffnungszeiten</h3>
                    <div className="text-sm sm:text-base text-gray-600 space-y-1">
                      <p>Montag: {OPENING_HOURS.monday}</p>
                      <p>Dienstag - Freitag: {OPENING_HOURS.tuesdayToFriday}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Bereit loszulegen?</h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto text-green-100">
              Kontaktiere uns heute, um mehr über unsere Hardware-Recycling Dienstleistungen zu erfahren.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-white text-green-800 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-sm sm:text-base md:text-lg"
              >
                Kontakt
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center border-2 border-white text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-sm sm:text-base md:text-lg"
              >
                Zurück zu Services
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
