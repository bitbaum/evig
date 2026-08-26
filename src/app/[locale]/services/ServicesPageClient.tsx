'use client'
import { Eyebrow } from '@/components/ui/Eyebrow'
import {
  Wrench,
  ArrowRight,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import { ORG } from '@/config/org'
import { safeJsonLd } from '@/lib/seo/json-ld'
import { Link } from '@/i18n/navigation'
import { FilterableSection } from '@/components/ui/FilterableSection'
import { Card } from '@/components/ui/card'
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
import { Section } from '@/components/layout/Section'

const ServiceCard: React.FC<{ service: Service }> = ({ service }) => {
  const t = useTranslations('services.page')

  return (
    <Card className="group hover:border-strong transition-colors duration-300 overflow-hidden flex flex-col h-full">
      <div className="p-6 sm:p-8 flex flex-col h-full">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <Eyebrow as="span">
              {service.category}
            </Eyebrow>
            {service.badge && (
              <Eyebrow as="span" className="text-action">
                · {service.badge}
              </Eyebrow>
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
          <div className="flex items-center justify-between gap-4">
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
              className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                service.available
                  ? 'border-strong text-text-primary hover:bg-surface-raised'
                  : 'border-default text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <span>{service.available ? t('learnMore') : t('details')}</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function ServicesPage() {
  const t = useTranslations('services.page')
  const tCatalog = useTranslations('services.catalog')

  // Category labels live in services.page (t) to avoid dynamic-key type issues
  const categoryLabels: Record<ServiceCategoryKey, string> = {
    software: t('categoryLabels.software'),
    organisations: t('categoryLabels.organisations'),
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

        <Section density="spacious" contained={false} className="border-t border-subtle text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Eyebrow as="div">{t('ctaEyebrow')}</Eyebrow>
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
        </Section>
      </main>
    </>
  )
}
