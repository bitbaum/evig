// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Code } from 'lucide-react'
import { ORG } from '@/config/org'
import { PageHero } from '@/components/layout/PageHero'
import { ValuesSection } from './sections/ValuesSection'
import { PhilosophySection } from './sections/PhilosophySection'
import { ServicesSection } from './sections/ServicesSection'
import { WhyOpenSourceSection } from './sections/WhyOpenSourceSection'
import { TechnologiesSection } from './sections/TechnologiesSection'
import { BenefitsSection } from './sections/BenefitsSection'
import { ProcessSection } from './sections/ProcessSection'
import { CTASection } from './sections/CTASection'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services.webDesign.meta' })
  return {
    title: { absolute: `${t('title')} | ${ORG.name}` },
    description: t('description'),
    openGraph: {
      title: `${t('title')} | ${ORG.name}`,
      description: t('description'),
      type: 'website',
      url: `${ORG.website}/services/web-design-development`,
    },
  }
}

export default async function WebDesignDevelopmentPage() {
  const t = await getTranslations('services.webDesign.hero')

  return (
    <main>
      <PageHero
        theme="services"
        icon={Code}
        title={t('title')}
        subtitle={t('subtitle')}
      >
        <div className="ui-public-cta-row mt-8">
          <Link href="/contact" className="ui-public-cta">
            {t('ctaStart')}
          </Link>
          <Link href="#services" className="ui-public-cta-ghost">
            {t('ctaDiscover')}
          </Link>
        </div>
      </PageHero>

      <ValuesSection />
      <PhilosophySection />
      <ServicesSection />
      <WhyOpenSourceSection />
      <TechnologiesSection />
      <BenefitsSection />
      <ProcessSection />
      <CTASection />
    </main>
  )
}
