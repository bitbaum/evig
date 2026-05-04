// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import Heading from '@/components/ui/Heading'
import {
  ArrowRight,
  Recycle,
  Shield,
  Wrench,
  Package,
  Truck,
  CheckCircle2,
  Leaf,
  MapPin,
  Phone,
  Clock
} from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { ORG, CONTACT, LOCATIONS, OPENING_HOURS } from '@/config/org'
import { getTranslations } from 'next-intl/server'
import { safeJsonLd } from '@/lib/seo/json-ld'

interface HardwareRecyclingPageProps {
  params: Promise<{ locale: string }>
}

// Icons are positional — parallel to features translation array
const FEATURE_ICONS = [Shield, Wrench, Package, Truck]

export async function generateMetadata({ params }: HardwareRecyclingPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services.hardwareRecycling' })
  return {
    title: `${t('meta.title')} | ${ORG.name}`,
    description: t('meta.description'),
    openGraph: {
      title: `${t('meta.ogTitle')} | ${ORG.name}`,
      description: t('meta.ogDescription'),
      type: 'website',
    },
  }
}

export default async function HardwareRecyclingPage({ params }: HardwareRecyclingPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services.hardwareRecycling' })

  const features = t.raw('features') as Array<{ title: string; description: string }>
  const pricingFeatures = t.raw('pricing.features') as string[]

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': t('hero.title'),
            'description': t('meta.description'),
            'provider': {
              '@type': 'Organization',
              'name': ORG.name,
              'url': ORG.website,
            },
            'serviceType': 'IT Equipment Recycling',
            'areaServed': {
              '@type': 'City',
              'name': LOCATIONS.store.city
            },
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'CHF'
            }
          })
        }}
      />

      <main className="min-h-screen bg-neutral-50">
        <PageHero
          theme="services"
          icon={Recycle}
          title={t('hero.title')}
          subtitle={t('hero.subtitle')}
        />

        {/* Features Grid */}
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {features.map((feature, index) => {
                const Icon = FEATURE_ICONS[index]
                return (
                  <div key={index} className="bg-primary-50 rounded-xl p-6 sm:p-8 shadow-lg border-l-4 border-primary-600">
                    <div className="flex items-start">
                      <div className="p-2 sm:p-3 bg-primary-100 rounded-lg text-primary-600 mr-3 sm:mr-4">
                        <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <div>
                        <Heading level={3} className="mb-2">{feature.title}</Heading>
                        <p className="text-sm sm:text-base text-neutral-600">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-neutral-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <Heading level={2} className="text-neutral-900 mb-3 sm:mb-4">{t('pricing.heading')}</Heading>
                <p className="text-base sm:text-lg md:text-xl text-neutral-600">{t('pricing.subtitle')}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12">
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-block bg-primary-100 text-primary-800 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
                    {t('pricing.badge')}
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 mb-2">
                    {t('pricing.price')}
                  </div>
                  <p className="text-sm sm:text-base text-neutral-600">{t('pricing.forMostItems')}</p>
                </div>

                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  {pricingFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-neutral-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/contact"
                  className="block w-full bg-primary-600 text-white text-center py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-300 text-sm sm:text-base"
                >
                  {t('pricing.cta')}
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
                <Leaf className="w-12 h-12 sm:w-16 sm:h-16 text-primary-600 mx-auto mb-3 sm:mb-4" />
                <Heading level={2} className="text-neutral-900 mb-3 sm:mb-4">{t('impact.heading')}</Heading>
                <p className="text-base sm:text-lg md:text-xl text-neutral-600">
                  {t('impact.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center">
                <div className="bg-primary-50 rounded-xl p-6 sm:p-8">
                  <div className="text-3xl sm:text-4xl font-bold text-primary-600 mb-2">100%</div>
                  <p className="text-sm sm:text-base text-neutral-700">{t('impact.dataSecurity')}</p>
                </div>
                <div className="bg-primary-50 rounded-xl p-6 sm:p-8">
                  <div className="text-3xl sm:text-4xl font-bold text-primary-600 mb-2">♻</div>
                  <p className="text-sm sm:text-base text-neutral-700">{t('impact.sustainableProcesses')}</p>
                </div>
                <div className="bg-primary-50 rounded-xl p-6 sm:p-8">
                  <div className="text-3xl sm:text-4xl font-bold text-primary-600 mb-2">🌱</div>
                  <p className="text-sm sm:text-base text-neutral-700">{t('impact.reducedEwaste')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-12 sm:py-16 md:py-20 bg-neutral-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <Heading level={2} className="text-neutral-900 mb-3 sm:mb-4">{t('contact.heading')}</Heading>
                <p className="text-base sm:text-lg md:text-xl text-neutral-600">
                  {t('contact.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
                  <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mb-3 sm:mb-4" />
                  <Heading level={3} className="mb-3 sm:mb-4">{t('contact.locations')}</Heading>
                  <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-neutral-600">
                    <p><strong>{t('contact.store')}:</strong><br />{LOCATIONS.store.full}</p>
                    <p><strong>{t('contact.warehouse')}:</strong><br />{LOCATIONS.warehouse.full}<br />{LOCATIONS.warehouse.note}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
                  <div className="mb-4 sm:mb-6">
                    <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mb-3 sm:mb-4" />
                    <Heading level={3} className="mb-3 sm:mb-4">{t('contact.contactInfo')}</Heading>
                    <p className="text-sm sm:text-base text-neutral-600">
                      <strong>{t('contact.phone')}:</strong><br />
                      {CONTACT.phone}
                    </p>
                  </div>

                  <div>
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mb-3 sm:mb-4" />
                    <Heading level={3} className="mb-3 sm:mb-4">{t('contact.hours')}</Heading>
                    <div className="text-sm sm:text-base text-neutral-600 space-y-1">
                      <p>{t('contact.monday')}: {OPENING_HOURS.monday}</p>
                      <p>{t('contact.weekdays')}: {OPENING_HOURS.tuesdayToFriday}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-primary-700 to-primary-800 text-white">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <Heading level={2} className="mb-4 sm:mb-6">{t('cta.heading')}</Heading>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto text-primary-100">
              {t('cta.body')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-white text-primary-800 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-primary-50 transition-colors duration-300 text-sm sm:text-base md:text-lg"
              >
                {t('cta.contact')}
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center border-2 border-white text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-sm sm:text-base md:text-lg"
              >
                {t('cta.back')}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
