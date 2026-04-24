import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { BenefitCard, BenefitCardGrid } from '@/components/community/BenefitCard'
import { InfoSection, NumberedSteps, Callout } from '@/components/community/InfoSection'
import { PageSection } from '@/components/community/PageSection'
import { responsiveTypography } from '@/lib/responsive'
import { ORG } from '@/config/org'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'
import { Target, Globe, Share2, Users } from 'lucide-react'

interface PartnershipsPageProps {
  params: Promise<{ locale: string }>
}

// Benefit icons are positional — parallel to translations array
const BENEFIT_ICONS = [Target, Globe, Share2, Users]

export async function generateMetadata({ params }: PartnershipsPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'getInvolved' })
  const title = `${t('partnerships.meta.title')} | ${ORG.name}`
  const description = t('partnerships.meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function PartnershipsPage({ params }: PartnershipsPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'getInvolved' })

  const benefits = t.raw('partnerships.benefits') as Array<{ title: string; description: string }>
  const sections = t.raw('partnerships.sections') as Array<{
    title: string
    items: string[]
    description?: string
  }>
  const callouts = t.raw('partnerships.callouts') as Array<{ title: string; content: string }>
  const partnershipProcessSteps = t.raw('partnerships.partnershipProcess.steps') as string[]
  const howToStartSteps = t.raw('partnerships.howToStart.steps') as string[]

  return (
    <InvolvementPageLayout
      title={t('partnerships.title')}
      description={t('partnerships.description')}
      ctaText={t('partnerships.ctaText')}
      ctaHref="/get-involved/kontakt?thema=partnerschaft"
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <PageSection
          title={t('partnerships.overview.title')}
          content={t('partnerships.overview.content')}
        />

        {/* Benefits Section */}
        <section className="space-y-8">
          <Heading level={2} className={`${responsiveTypography.section} text-gray-900`}>
            {t('partnerships.benefitsHeading')}
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

        {/* Partnership Process */}
        <NumberedSteps
          title={t('partnerships.partnershipProcess.title')}
          steps={partnershipProcessSteps.map((text) => ({ text }))}
        />

        {/* How to Get Started */}
        <NumberedSteps
          title={t('partnerships.howToStart.title')}
          steps={howToStartSteps.map((text) => ({ text }))}
        />
      </div>
    </InvolvementPageLayout>
  )
}
