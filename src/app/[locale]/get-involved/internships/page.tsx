import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { BenefitCard, BenefitCardGrid } from '@/components/community/BenefitCard'
import { InfoSection, NumberedSteps, Callout } from '@/components/community/InfoSection'
import { PageSection } from '@/components/community/PageSection'
import { responsiveTypography } from '@/lib/responsive'
import { ORG } from '@/config/org'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'
import { Briefcase, GraduationCap, Users, BookOpen } from 'lucide-react'

interface InternshipsPageProps {
  params: Promise<{ locale: string }>
}

// Benefit icons are positional — parallel to translations array
const BENEFIT_ICONS = [Briefcase, GraduationCap, Users, BookOpen]

export async function generateMetadata({ params }: InternshipsPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'getInvolved' })
  const title = `${t('internships.meta.title')} | ${ORG.name}`
  const description = t('internships.meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function InternshipsPage({ params }: InternshipsPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'getInvolved' })

  const benefits = t.raw('internships.benefits') as Array<{ title: string; description: string }>
  const sections = t.raw('internships.sections') as Array<{
    title: string
    items: string[]
    description?: string
  }>
  const callouts = t.raw('internships.callouts') as Array<{ title: string; content: string }>
  const howToStartSteps = t.raw('internships.howToStart.steps') as string[]

  return (
    <InvolvementPageLayout
      title={t('internships.title')}
      description={t('internships.description')}
      ctaText={t('internships.ctaText')}
      ctaHref="/get-involved/kontakt?thema=praktikum"
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <PageSection
          title={t('internships.overview.title')}
          content={t('internships.overview.content')}
        />

        {/* Benefits Section */}
        <section className="space-y-8">
          <Heading level={2} className={`${responsiveTypography.section} text-neutral-900`}>
            {t('internships.benefitsHeading')}
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

        {/* How to Apply */}
        <NumberedSteps
          title={t('internships.howToStart.title')}
          steps={howToStartSteps.map((text) => ({ text }))}
        />
      </div>
    </InvolvementPageLayout>
  )
}
