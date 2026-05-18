// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Wrench, CheckCircle2, Clock, Shield, Zap } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { IconBadge } from '@/components/ui/IconBadge'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

// Icons are positional — parallel to features translation array
const FEATURE_ICONS = [Wrench, Zap, Shield, Clock]

interface Props {
  params: Promise<{ service: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services.repair' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function RepairPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services.repair' })

  const features = t.raw('features') as Array<{ title: string; description: string }>
  const process = t.raw('process') as Array<{ title: string; description: string }>
  const pricingDetails = t.raw('pricing.details') as string[]

  return (
    <main>
      <PageHero
        theme="services"
        icon={Wrench}
        title={t('hero.title')}
        subtitle={t('hero.description')}
      >
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto mt-4">
          <strong>{t('hero.subtitle')}</strong>
        </p>
      </PageHero>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {features.map((feature, index) => {
              const Icon = FEATURE_ICONS[index]
              return (
                <div key={index} className="bg-white dark:bg-neutral-900 rounded-xl p-8 border border-neutral-200 dark:border-white/[0.08]">
                  <div className="flex items-start mb-6">
                    <IconBadge icon={Icon} theme="services" size="lg" className="mr-4" />
                    <div>
                      <Heading level={3} className="text-2xl font-bold mb-3">{feature.title}</Heading>
                      <p className="text-neutral-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <Heading level={2} className="text-3xl font-bold mb-12 text-center">{t('processHeading')}</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((step, index) => (
              <div key={index} className="bg-neutral-50 rounded-xl p-8">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  {index + 1}
                </div>
                <Heading level={3} className="text-xl font-semibold mb-3">{step.title}</Heading>
                <p className="text-neutral-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white dark:bg-neutral-900 rounded-xl p-8 border border-neutral-200 dark:border-white/[0.08]">
            <Heading level={2} className="text-3xl font-bold mb-8 text-center">{t('pricing.heading')}</Heading>
            <div className="text-center mb-8">
              <p className="text-2xl font-bold text-primary-600">{t('pricing.base')}</p>
            </div>
            <div className="space-y-4">
              {pricingDetails.map((detail, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-primary-500 mr-3" />
                  <span className="text-neutral-600">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <Heading level={2} className="text-4xl font-bold mb-6">{t('cta.heading')}</Heading>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-primary-100">
            {t('cta.body')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-white text-primary-800 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-colors duration-300 text-lg"
            >
              {t('cta.contact')}
            </Link>
            <Link
              href="/services"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
            >
              {t('cta.allServices')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
