/**
 * ServiceCTA Component
 * 
 * Reusable call-to-action section for service pages.
 * Maintains consistent branding and CTAs.
 */

import Link from 'next/link'

interface ServiceCTAProps {
  serviceTitle: string
}

export default function ServiceCTA({ serviceTitle }: ServiceCTAProps) {
  return (
    <section className="py-20 bg-gradient-to-r from-primary-700 to-primary-800 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-6">Bereit loszulegen?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto text-primary-100">
          Kontaktieren Sie uns heute, um mehr über unsere {serviceTitle} Dienstleistungen zu erfahren.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contact"
            className="inline-block bg-white text-primary-800 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-colors duration-300 text-lg"
          >
            Kontakt
          </Link>
          <Link
            href="/services"
            className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
          >
            Zurück zu Services
          </Link>
        </div>
      </div>
    </section>
  )
}

