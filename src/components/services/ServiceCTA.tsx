/**
 * ServiceCTA Component
 *
 * Reusable call-to-action section for service pages.
 * Maintains consistent branding and CTAs.
 */

'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import AppointmentBookingForm from './AppointmentBookingForm'
import Heading from '@/components/ui/Heading'

interface ServiceCTAProps {
  serviceTitle: string
  serviceSlug?: string
  pricing?: string
}

export default function ServiceCTA({ serviceTitle, serviceSlug, pricing }: ServiceCTAProps) {
  const t = useTranslations('components.serviceCta')
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-primary-700 to-primary-800 text-white">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <Heading level={2} className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">{t('heading')}</Heading>
        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto text-primary-100">
          {t('desc', { serviceTitle })}
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
            className="inline-block bg-white text-primary-800 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-primary-50 transition-colors duration-300 text-base sm:text-lg min-h-[44px] touch-target"
          >
            {t('contact')}
          </Link>
          <Link
            href="/services"
            className="inline-block border-2 border-white text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-white/20 transition-colors duration-300 text-base sm:text-lg min-h-[44px] touch-target"
          >
            {t('backToServices')}
          </Link>
        </div>
      </div>
    </section>
  )
}
