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
import { GraduationCap, Briefcase, Users, Heart } from 'lucide-react'

interface WorkReintegrationPageProps {
  params: Promise<{ locale: string }>
}

// Benefit icons are positional — parallel to translations array
const BENEFIT_ICONS = [GraduationCap, Briefcase, Users, Heart]

export async function generateMetadata({ params }: WorkReintegrationPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'getInvolved' })
  const title = `${t('workReintegration.meta.title')} | ${ORG.name}`
  const description = t('workReintegration.meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function WorkReintegrationPage({ params }: WorkReintegrationPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'getInvolved' })

  const benefits = t.raw('workReintegration.benefits') as Array<{ title: string; description: string }>
  const sections = t.raw('workReintegration.sections') as Array<{
    title: string
    items: string[]
    description?: string
  }>
  const callouts = t.raw('workReintegration.callouts') as Array<{ title: string; content: string }>
  const howToStartSteps = t.raw('workReintegration.howToStart.steps') as string[]

  return (
    <InvolvementPageLayout
      title={t('workReintegration.title')}
      description={t('workReintegration.description')}
      ctaText={t('workReintegration.ctaText')}
      ctaHref="/get-involved/kontakt?thema=wiedereinstieg"
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <PageSection
          title={t('workReintegration.overview.title')}
          content={t('workReintegration.overview.content')}
        />

        {/* Benefits Section */}
        <section className="space-y-8">
          <Heading level={2} className={`${responsiveTypography.section} text-neutral-900`}>
            {t('workReintegration.benefitsHeading')}
          </Heading>
          <BenefitCardGrid>
            {benefits.map((benefit, index) => (
              <BenefitCard
                key={index}
                icon={BENEFIT_ICONS[index]}
                title={benefit.title}
                description={benefit.description}
              />
            ))}
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

        {/* How to Get Started */}
        <NumberedSteps
          title={t('workReintegration.howToStart.title')}
          steps={howToStartSteps.map((text) => ({ text }))}
        />
      </div>
    </InvolvementPageLayout>
  )
}
