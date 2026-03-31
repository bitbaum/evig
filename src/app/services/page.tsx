'use client'

import {
  Wrench,
  ArrowRight,
  CheckCircle2,
  Zap,
  Calendar,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FilterableSection } from '@/components/ui/FilterableSection'
import Heading from '@/components/ui/Heading'
import { PageHero } from '@/components/layout/PageHero'
import { services, serviceFilters, type Service } from './data'

const ServiceCard: React.FC<{ service: Service }> = ({ service }) => {
  const { data: session } = useSession()
  const router = useRouter()
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'booked' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleBooking = async () => {
    if (!session?.user) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    if (!service.slug) {
      router.push(service.href)
      return
    }

    setBookingStatus('booking')
    setErrorMessage('')

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceSlug: service.slug,
          description: `Termin für ${service.title}`,
          urgency: 'normal'
        }),
      })

      if (response.ok) {
        setBookingStatus('booked')
        setTimeout(() => {
          router.push('/dashboard/appointments')
        }, 1500)
      } else {
        const error = await response.text()
        setBookingStatus('error')
        setErrorMessage(error || 'Terminbuchung fehlgeschlagen')
      }
    } catch {
      setBookingStatus('error')
      setErrorMessage('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    }
  }

  return (
    <div className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full">
      <div className="p-4 sm:p-6 md:p-8 flex flex-col h-full">
        <div className="flex items-start mb-4 sm:mb-6">
          <div className={`p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 transition-colors duration-300 ${
            service.available
              ? 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white'
              : 'bg-gray-100 text-gray-400'
          }`}>
            <service.icon className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl sm:text-2xl font-bold">{service.title}</h3>
              {service.badge && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  {service.badge}
                </span>
              )}
            </div>
            <div className={`flex items-center font-semibold mb-4 ${
              service.available ? 'text-green-600' : 'text-gray-400'
            }`}>
              <Zap className="w-4 h-4 mr-2" />
              <span>{service.highlight}</span>
            </div>
          </div>
        </div>
        <p className="text-gray-600 mb-6 flex-grow">{service.description}</p>
        <div className="space-y-3 mb-6">
          {service.features.map((feature, i) => (
            <div key={i} className="flex items-center text-gray-600">
              <CheckCircle2 className={`w-5 h-5 mr-3 flex-shrink-0 ${
                service.available ? 'text-green-500' : 'text-gray-400'
              }`} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            {service.pricing ? (
              <span className={`text-lg font-semibold ${
                service.available ? 'text-green-600' : 'text-gray-400'
              }`}>
                {service.pricing}
              </span>
            ) : (
              <span className="text-gray-500 text-sm">Pricing TBD</span>
            )}
            <Link
              href={service.href}
              className={`inline-flex items-center font-medium transition-colors duration-300 group text-sm ${
                service.available
                  ? 'text-gray-600 hover:text-gray-700'
                  : 'text-gray-500 hover:text-gray-600'
              }`}
            >
              <span>Details</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          {service.available && (
            <div className="flex gap-2">
              {bookingStatus === 'booked' ? (
                <div className="w-full inline-flex items-center justify-center text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Termin angefragt!
                </div>
              ) : bookingStatus === 'booking' ? (
                <div className="w-full inline-flex items-center justify-center text-gray-600 font-semibold bg-gray-50 px-4 py-2 rounded-lg">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird gebucht...
                </div>
              ) : !session?.user ? (
                <button
                  onClick={() => router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))}
                  className="flex-1 inline-flex items-center justify-center text-green-600 hover:text-green-800 font-semibold bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg transition-colors duration-300"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Termin buchen
                </button>
              ) : service.slug ? (
                <button
                  onClick={handleBooking}
                  className="flex-1 inline-flex items-center justify-center text-white font-semibold bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors duration-300 disabled:opacity-50"
                  disabled={bookingStatus !== 'idle' && bookingStatus !== 'error'}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Termin buchen
                </button>
              ) : (
                <Link
                  href={service.href}
                  className="flex-1 inline-flex items-center justify-center text-green-600 hover:text-green-800 font-semibold bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg transition-colors duration-300"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Mehr erfahren
                </Link>
              )}
            </div>
          )}

          {bookingStatus === 'error' && errorMessage && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Computer Repair & IT Services',
            'description': 'Professional computer repair, web development, data recovery, Linux support, and hardware recycling services.',
            'provider': {
              '@type': 'Organization',
              'name': 'Revamp-IT',
              'url': 'https://revamp-it.ch',
              'logo': 'https://revamp-it.ch/logo.png'
            },
            'serviceType': [
              'Computer Repair',
              'Web Design & Development',
              'Data Recovery',
              'Linux Support',
              'Hardware Recycling',
              'Open Source Solutions',
              'Enterprise AI Solutions'
            ],
            'areaServed': {
              '@type': 'City',
              'name': 'Your City'
            }
          })
        }}
      />
      <main className="min-h-screen bg-gray-50">
        <PageHero
          theme="services"
          icon={Wrench}
          title="Experten-IT-Dienstleistungen"
          subtitle="Nachhaltige Lösungen für Ihre Technologiebedürfnisse. Wir kombinieren technische Expertise mit Umweltverantwortung, um umfassende IT-Lösungen zu bieten, die Ihnen Geld sparen und Elektroschrott reduzieren."
        />

        <FilterableSection
          title="Unsere Dienstleistungen"
          description="Die Reparaturdauer variiert je nach Teileverfügbarkeit und dauert in der Regel einige Wochen."
          items={services}
          filters={serviceFilters}
          renderItem={(service) => <ServiceCard service={service as Service} />}
          keyExtractor={(service) => (service as Service).title}
          noResultsMessage="Keine Dienstleistungen gefunden, die den ausgewählten Filtern entsprechen."
          showResultsCount={true}
        />

        <section className="py-12 sm:py-16 md:py-20 bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <Heading level={2} className="mb-4 sm:mb-6 text-gray-900">Bereit, Ihre Technologie zu erneuern?</Heading>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto text-gray-600">Kontaktieren Sie uns heute für eine kostenlose Beratung und entdecken Sie, wie wir Ihnen helfen können, das Beste aus Ihren Geräten herauszuholen.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-500 transition-colors duration-300 text-lg"
              >
                Kontaktieren Sie uns
              </Link>
              <Link
                href="https://www.revamp-it.ch/index.php/de/shop-de"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border-2 border-blue-300 text-blue-700 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-300 text-base sm:text-lg"
              >
                Inventar durchsuchen
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
