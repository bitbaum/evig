// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { BenefitCard, BenefitCardGrid } from '@/components/community/BenefitCard'
import { InfoSection, NumberedSteps, Callout } from '@/components/community/InfoSection'
import { PageSection } from '@/components/community/PageSection'
import { responsiveTypography } from '@/lib/responsive'
import { ORG } from '@/config/org'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'
import { Cpu, Calendar, Users, BookOpen } from 'lucide-react'

interface ITHilfeTechnikerPageProps {
  params: Promise<{ locale: string }>
}

// Benefit icons are positional — parallel to translations array
const BENEFIT_ICONS = [Cpu, Calendar, Users, BookOpen]

export async function generateMetadata({ params }: ITHilfeTechnikerPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'getInvolved' })
  const title = `${t('itHilfeTechniker.meta.title')} | ${ORG.name}`
  const description = t('itHilfeTechniker.meta.description')
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function ITHilfeTechnikerPage({ params }: ITHilfeTechnikerPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'getInvolved' })

  const benefits = t.raw('itHilfeTechniker.benefits') as Array<{ title: string; description: string }>
  const sections = t.raw('itHilfeTechniker.sections') as Array<{
    title: string
    items: string[]
    description?: string
  }>
  const callouts = t.raw('itHilfeTechniker.callouts') as Array<{ title: string; content: string }>
  const howToStartSteps = t.raw('itHilfeTechniker.howToStart.steps') as string[]

  return (
    <InvolvementPageLayout
      title={t('itHilfeTechniker.title')}
      description={t('itHilfeTechniker.description')}
      ctaText={t('itHilfeTechniker.ctaText')}
      ctaHref="/profil/techniker"
    >
      <div className="space-y-16">
        {/* Overview */}
        <PageSection
          title={t('itHilfeTechniker.overview.title')}
          content={t('itHilfeTechniker.overview.content')}
        />

        {/* Benefits */}
        <section className="space-y-8">
          <Heading level={2} className={`${responsiveTypography.section} text-text-primary`}>
            {t('itHilfeTechniker.benefitsHeading')}
          </Heading>
          <BenefitCardGrid>
            {BENEFIT_ICONS.map((Icon, index) => {
              const benefit = benefits[index]
              if (!benefit) return null
              return (
                <BenefitCard
                  key={index}
                  icon={Icon}
                  title={benefit.title}
                  description={benefit.description}
                />
              )
            })}
          </BenefitCardGrid>
        </section>

        {/* Sections */}
        {sections.map((section, index) => (
          <InfoSection
            key={index}
            title={section.title}
            items={section.items.map((text) => ({ text }))}
            description={section.description}
          />
        ))}

        {/* Callouts */}
        {callouts.map((callout, index) => (
          <Callout
            key={index}
            title={callout.title}
            content={callout.content}
          />
        ))}

        {/* How to get started */}
        <NumberedSteps
          title={t('itHilfeTechniker.howToStart.title')}
          steps={howToStartSteps.map((text) => ({ text }))}
        />
      </div>
    </InvolvementPageLayout>
  )
}
