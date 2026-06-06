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
import { ROUTES } from '@/config/routes'

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
    <div className="group card-shell hover:border-strong transition-colors duration-300 overflow-hidden flex flex-col h-full">
      <div className="p-6 sm:p-8 flex flex-col h-full">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
              {service.category}
            </span>
            {service.badge && (
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-action">
                · {service.badge}
              </span>
            )}
          </div>
          <Heading level={3} className="text-xl sm:text-2xl font-semibold text-text-primary">
            {service.title}
          </Heading>
          <div className={`mt-3 flex items-center text-sm font-semibold ${
            service.available ? 'text-action' : 'text-text-muted'
          }`}>
            <Zap className="w-4 h-4 mr-2" />
            <span>{service.highlight}</span>
          </div>
        </div>
        <p className="text-text-secondary mb-6 grow">{service.description}</p>
        <div className="space-y-3 mb-6">
          {service.features.map((feature, i) => (
            <div key={i} className="flex items-center text-text-secondary">
              <CheckCircle2 className={`w-5 h-5 mr-3 shrink-0 ${
                service.available ? 'text-action' : 'text-text-muted'
              }`} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-6 border-t border">
          <div className="flex items-center justify-between mb-4">
            {service.pricing ? (
              <span className={`text-lg font-semibold ${
                service.available ? 'text-action' : 'text-text-muted'
              }`}>
                {service.pricing}
              </span>
            ) : (
              <span className="text-text-tertiary text-sm">{t('pricingTbd')}</span>
            )}
            <Link
              href={service.href}
              className={`inline-flex items-center font-medium transition-colors duration-300 group text-sm ${
                service.available
                  ? 'text-text-secondary hover:text-text-secondary'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <span>{t('details')}</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          {service.available && (
            <div className="flex gap-2">
              {bookingStatus === 'booked' ? (
                <Button variant="ghost" disabled className="w-full">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {t('appointmentRequested')}
                </Button>
              ) : bookingStatus === 'booking' ? (
                <Button variant="ghost" disabled className="w-full">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('booking')}
                </Button>
              ) : !session?.user ? (
                <Button
                  variant="primary"
                  onClick={() => router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))}
                  className="flex-1"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('bookAppointment')}
                </Button>
              ) : service.slug ? (
                <Button
                  variant="primary"
                  onClick={handleBooking}
                  className="flex-1"
                  disabled={bookingStatus !== 'idle' && bookingStatus !== 'error'}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('bookAppointment')}
                </Button>
              ) : (
                <Button as={Link} href={service.href} variant="primary" className="flex-1">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {t('learnMore')}
                </Button>
              )}
            </div>
          )}

          {bookingStatus === 'error' && errorMessage && (
            <div className="mt-2 text-xs text-error-600 dark:text-error-300 bg-error-50 dark:bg-error-900/20 p-2 rounded-sm">
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
      badge: config.badgeKey ? t(`badges.${config.badgeKey}` as never) : undefined,
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
      <main>
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

        <section className="border-t border-subtle py-20 text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="ui-public-eyebrow">{t('ctaEyebrow')}</div>
            <h2 className="ui-public-display-lg mt-4">{t('ctaTitle')}</h2>
            <p className="ui-public-section-lede mt-6 mx-auto">{t('ctaSubtitle')}</p>
            <div className="ui-public-cta-row mt-10">
              <Link href="/contact" className="ui-public-cta">
                {t('ctaContact')}
              </Link>
              <Link href={ROUTES.public.shop} className="ui-public-cta-ghost">
                {t('ctaInventory')}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
