'use client'
import {
  Wrench,
  ArrowRight,
  CheckCircle2,
  Zap,
  Calendar,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ORG } from '@/config/org'
import { safeJsonLd } from '@/lib/seo/json-ld'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { URGENCY } from '@/config/it-hilfe'
import { Link } from '@/i18n/navigation'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FilterableSection } from '@/components/ui/FilterableSection'
import Heading from '@/components/ui/Heading'
import { PageHero } from '@/components/layout/PageHero'
import {
  SERVICE_CONFIGS,
  SERVICE_CATEGORY_KEYS,
  buildServiceFilters,
  type Service,
  type ServiceCategoryKey,
} from './data'
import { useTranslations } from 'next-intl'

const ServiceCard: React.FC<{ service: Service }> = ({ service }) => {
  const { data: session } = useSession()
  const router = useRouter()
  const t = useTranslations('services.page')
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
      const result = await apiFetch<unknown>('/api/appointments', {
        method: 'POST',
        body: {
          serviceSlug: service.slug,
          description: `Termin für ${service.title}`,
          urgency: URGENCY.NORMAL,
        },
      })

      if (result.success) {
        setBookingStatus('booked')
        setTimeout(() => {
          router.push('/dashboard/appointments')
        }, 1500)
      } else {
        logger.warn('Failed to book service appointment', { error: result.error })
        setBookingStatus('error')
        setErrorMessage(result.error || t('bookingFailed'))
      }
    } catch (err) {
      logger.warn('Failed to book service appointment', { error: err })
      setBookingStatus('error')
      setErrorMessage(t('networkError'))
    }
  }

  return (
    <div className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full">
      <div className="p-4 sm:p-6 md:p-8 flex flex-col h-full">
        <div className="flex items-start mb-4 sm:mb-6">
          <div className={`p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 transition-colors duration-300 ${
            service.available
              ? 'bg-primary-100 text-primary-600 group-hover:bg-primary-600 group-hover:text-white'
              : 'bg-neutral-100 text-neutral-400'
          }`}>
            <service.icon className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Heading level={3} className="text-xl sm:text-2xl font-bold">{service.title}</Heading>
              {service.badge && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                  {service.badge}
                </span>
              )}
            </div>
            <div className={`flex items-center font-semibold mb-4 ${
              service.available ? 'text-primary-600' : 'text-neutral-400'
            }`}>
              <Zap className="w-4 h-4 mr-2" />
              <span>{service.highlight}</span>
            </div>
          </div>
        </div>
        <p className="text-neutral-600 mb-6 flex-grow">{service.description}</p>
        <div className="space-y-3 mb-6">
          {service.features.map((feature, i) => (
            <div key={i} className="flex items-center text-neutral-600">
              <CheckCircle2 className={`w-5 h-5 mr-3 flex-shrink-0 ${
                service.available ? 'text-primary-500' : 'text-neutral-400'
              }`} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-6 border-t border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            {service.pricing ? (
              <span className={`text-lg font-semibold ${
                service.available ? 'text-primary-600' : 'text-neutral-400'
              }`}>
                {service.pricing}
              </span>
            ) : (
              <span className="text-neutral-500 text-sm">{t('pricingTbd')}</span>
            )}
            <Link
              href={service.href}
              className={`inline-flex items-center font-medium transition-colors duration-300 group text-sm ${
                service.available
                  ? 'text-neutral-600 hover:text-neutral-700'
                  : 'text-neutral-500 hover:text-neutral-600'
              }`}
            >
              <span>{t('details')}</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          {service.available && (
            <div className="flex gap-2">
              {bookingStatus === 'booked' ? (
                <div className="w-full inline-flex items-center justify-center text-primary-600 font-semibold bg-primary-50 px-4 py-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {t('appointmentRequested')}
                </div>
              ) : bookingStatus === 'booking' ? (
                <div className="w-full inline-flex items-center justify-center text-neutral-600 font-semibold bg-neutral-50 px-4 py-2 rounded-lg">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('booking')}
                </div>
              ) : !session?.user ? (
                <button
                  onClick={() => router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))}
                  className="flex-1 inline-flex items-center justify-center text-primary-600 hover:text-primary-800 font-semibold bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-lg transition-colors duration-300"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('bookAppointment')}
                </button>
              ) : service.slug ? (
                <Button
                  onClick={handleBooking}
                  className="flex-1"
                  disabled={bookingStatus !== 'idle' && bookingStatus !== 'error'}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('bookAppointment')}
                </Button>
              ) : (
                <Link
                  href={service.href}
                  className="flex-1 inline-flex items-center justify-center text-primary-600 hover:text-primary-800 font-semibold bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-lg transition-colors duration-300"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {t('learnMore')}
                </Link>
              )}
            </div>
          )}

          {bookingStatus === 'error' && errorMessage && (
            <div className="mt-2 text-xs text-error-600 bg-error-50 p-2 rounded">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ServicesPage() {
  const t = useTranslations('services.page')
  const tCatalog = useTranslations('services.catalog')

  // Category labels live in services.page (t) to avoid dynamic-key type issues
  const categoryLabels: Record<ServiceCategoryKey, string> = {
    hardware: t('categoryLabels.hardware'),
    software: t('categoryLabels.software'),
    soon: t('categoryLabels.soon'),
  }

  // Use .raw() with `as never` to access dynamic service entry keys
  // (next-intl's typed t() only accepts statically-known keys)
  type CatalogEntry = { title: string; description: string; features: string[]; highlight: string; pricing: string }
  const services: Service[] = SERVICE_CONFIGS.map(config => {
    const entry = tCatalog.raw(config.key as never) as CatalogEntry
    return {
      ...config,
      title: entry.title,
      description: entry.description,
      features: entry.features,
      category: categoryLabels[config.categoryKey],
      highlight: entry.highlight,
      // Empty string means "no pricing" → shows pricingTbd in ServiceCard
      pricing: entry.pricing || undefined,
    }
  })

  const serviceFilters = buildServiceFilters(t('filterByCategory'), categoryLabels)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': t('schemaName'),
            'description': t('schemaDescription'),
            'provider': {
              '@type': 'Organization',
              'name': ORG.name,
              'url': ORG.website,
              'logo': `${ORG.website}/logo.png`
            },
            'serviceType': services.filter(s => s.available).map(s => s.title),
            'areaServed': {
              '@type': 'City',
              'name': t('schemaCity')
            }
          })
        }}
      />
      <main className="min-h-screen bg-neutral-50">
        <PageHero
          theme="services"
          icon={Wrench}
          title={t('title')}
          subtitle={t('subtitle')}
        />

        <FilterableSection
          title={t('servicesTitle')}
          description={t('servicesDescription')}
          items={services}
          filters={serviceFilters}
          renderItem={(service) => <ServiceCard service={service as Service} />}
          keyExtractor={(service) => (service as Service).key}
          noResultsMessage={t('noResults')}
          showResultsCount={true}
        />

        <section className="py-12 sm:py-16 md:py-20 bg-white border-t border-neutral-200">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <Heading level={2} className="mb-4 sm:mb-6 text-neutral-900">{t('ctaTitle')}</Heading>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto text-neutral-600">{t('ctaSubtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-block bg-info-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-info-500 transition-colors duration-300 text-lg"
              >
                {t('ctaContact')}
              </Link>
              <Link
                href="/shop"
                className="inline-block border-2 border-info-300 text-info-700 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-info-50 transition-colors duration-300 text-base sm:text-lg"
              >
                {t('ctaInventory')}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
