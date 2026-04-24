import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { BenefitCard, BenefitCardGrid } from '@/components/community/BenefitCard'
import { InfoSection, NumberedSteps, Callout } from '@/components/community/InfoSection'
import { PageSection } from '@/components/community/PageSection'
import { responsiveTypography } from '@/lib/responsive'
import { ORG } from '@/config/org'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'
import { Code, Cpu, Users, Lightbulb } from 'lucide-react'

interface TechnicalExpertsPageProps {
  params: Promise<{ locale: string }>
}

// Benefit icons are positional — parallel to translations array
const BENEFIT_ICONS = [Code, Cpu, Users, Lightbulb]

export async function generateMetadata({ params }: TechnicalExpertsPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'getInvolved' })
  const title = `${t('technicalExperts.meta.title')} | ${ORG.name}`
  const description = t('technicalExperts.meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function TechnicalExpertsPage({ params }: TechnicalExpertsPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'getInvolved' })

  const benefits = t.raw('technicalExperts.benefits') as Array<{ title: string; description: string }>
  const sections = t.raw('technicalExperts.sections') as Array<{
    title: string
    items: string[]
    description?: string
  }>
  const callouts = t.raw('technicalExperts.callouts') as Array<{ title: string; content: string }>
  const howToStartSteps = t.raw('technicalExperts.howToStart.steps') as string[]

  return (
    <InvolvementPageLayout
      title={t('technicalExperts.title')}
      description={t('technicalExperts.description')}
      ctaText={t('technicalExperts.ctaText')}
      ctaHref="/get-involved/kontakt?thema=technische-experten"
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <PageSection
          title={t('technicalExperts.overview.title')}
          content={t('technicalExperts.overview.content')}
        />

        {/* Benefits Section */}
        <section className="space-y-8">
          <Heading level={2} className={`${responsiveTypography.section} text-gray-900`}>
            {t('technicalExperts.benefitsHeading')}
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
          title={t('technicalExperts.howToStart.title')}
          steps={howToStartSteps.map((text) => ({ text }))}
        />
      </div>
    </InvolvementPageLayout>
  )
}
