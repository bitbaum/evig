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
    title: { absolute: title },
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function RepairPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services.repair' })
  const tEye = await getTranslations({ locale, namespace: 'common.eyebrows' })

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
        <p className="text-lg text-text-secondary max-w-2xl mx-auto mt-4">
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
                <div key={index} className="bg-surface-base rounded-xl p-8 border">
                  <div className="flex items-start mb-6">
                    <IconBadge icon={Icon} theme="services" size="lg" className="mr-4" />
                    <div>
                      <Heading level={3} className="text-2xl font-bold mb-3">{feature.title}</Heading>
                      <p className="text-text-secondary">{feature.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-surface-base">
        <div className="container mx-auto px-4">
          <Heading level={2} className="text-3xl font-bold mb-12 text-center">{t('processHeading')}</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((step, index) => (
              <div key={index} className="bg-surface-raised/50 rounded-xl p-8">
                <div className="w-12 h-12 bg-action text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  {index + 1}
                </div>
                <Heading level={3} className="text-xl font-semibold mb-3">{step.title}</Heading>
                <p className="text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-surface-base rounded-xl p-8 border">
            <Heading level={2} className="text-3xl font-bold mb-8 text-center">{t('pricing.heading')}</Heading>
            <div className="text-center mb-8">
              <p className="text-2xl font-bold text-action">{t('pricing.base')}</p>
            </div>
            <div className="space-y-4">
              {pricingDetails.map((detail, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-action mr-3" />
                  <span className="text-text-secondary">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-subtle py-20 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="ui-public-eyebrow">{tEye('ready')}</div>
          <h2 className="ui-public-display-lg mt-4">{t('cta.heading')}</h2>
          <p className="ui-public-section-lede mt-6 mx-auto">{t('cta.body')}</p>
          <div className="ui-public-cta-row mt-10">
            <Link href="/contact" className="ui-public-cta">
              {t('cta.contact')}
            </Link>
            <Link href="/services" className="ui-public-cta-ghost">
              {t('cta.allServices')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
