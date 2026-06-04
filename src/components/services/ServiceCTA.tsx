/**
 * ServiceCTA Component
 *
 * Reusable call-to-action section for service pages.
 * Maintains consistent branding and CTAs.
 */

import Link from 'next/link'
import AppointmentBookingForm from './AppointmentBookingForm'

interface ServiceCTAProps {
  serviceTitle: string
  serviceSlug?: string
  pricing?: string
}

export default function ServiceCTA({ serviceTitle, serviceSlug, pricing }: ServiceCTAProps) {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-action text-white">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Bereit loszulegen?</h2>
        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto text-action-text">
          Buchen Sie jetzt Ihren Termin für unsere {serviceTitle} Dienstleistungen.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          {serviceSlug && (
            <AppointmentBookingForm
              serviceSlug={serviceSlug}
              serviceTitle={serviceTitle}
              pricing={pricing}
            />
          )}
          <Link
            href="/contact"
            className="inline-block bg-surface-base text-action px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-action-muted transition-colors duration-300 text-base sm:text-lg min-h-touch touch-target"
          >
            Kontakt
          </Link>
          <Link
            href="/services"
            className="inline-block border-2 border-white text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-surface-base/20 transition-colors duration-300 text-base sm:text-lg min-h-touch touch-target"
          >
            Zurück zu Services
          </Link>
        </div>
      </div>
    </section>
  )
}

