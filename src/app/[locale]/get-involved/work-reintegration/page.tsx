import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { BenefitCard, BenefitCardGrid } from '@/components/community/BenefitCard'
import { InfoSection, NumberedSteps, Callout } from '@/components/community/InfoSection'
import { PageSection } from '@/components/community/PageSection'
import { WORK_REINTEGRATION_PAGE } from '@/config/community'
import { responsiveTypography } from '@/lib/responsive'
import { ORG } from '@/config/org'
import Heading from '@/components/ui/Heading'

export const metadata: Metadata = {
  title: `Arbeitsreintegration | ${ORG.name}`,
  description: 'Nimm an unserem Arbeitsreintegrationsprogramm teil, um wertvolle Fähigkeiten und Erfahrungen in der Technologie zu sammeln und dabei deine Karriere wieder aufzubauen.',
}

export default function WorkReintegrationPage() {
  return (
    <InvolvementPageLayout
      title="Arbeitsreintegrationsprogramm"
      description="Schliess dich unserem unterstützenden Programm an, um deine Karriere in Technologie und Nachhaltigkeit wieder aufzubauen."
      ctaText="Interesse bekunden"
      ctaHref="/get-involved/kontakt?thema=wiedereinstieg"
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <PageSection
          title={WORK_REINTEGRATION_PAGE.overview.title}
          content={WORK_REINTEGRATION_PAGE.overview.content}
        />

        {/* Benefits Section */}
        <section className="space-y-8">
          <Heading level={2} className={`${responsiveTypography.section} text-gray-900`}>
            Programmvorteile
          </Heading>
          <BenefitCardGrid>
            {WORK_REINTEGRATION_PAGE.benefits?.map((benefit, index) => (
              <BenefitCard
                key={index}
                icon={benefit.icon}
                title={benefit.title}
                description={benefit.description}
              />
            ))}
          </BenefitCardGrid>
        </section>

        {/* Sections from config */}
        {WORK_REINTEGRATION_PAGE.sections?.map((section, index) => (
          <InfoSection
            key={index}
            title={section.title}
            items={section.items}
          />
        ))}

        {/* Callouts from config */}
        {WORK_REINTEGRATION_PAGE.callouts?.map((callout, index) => (
          <Callout
            key={index}
            title={callout.title}
            content={callout.content}
          />
        ))}

        {/* How to Get Started */}
        <NumberedSteps
          title="Wie du anfangen kannst"
          steps={[
            { text: 'Kontaktiere uns, um deine Situation zu besprechen' },
            { text: 'Triff dich mit unserem Team für eine Bewertung' },
            { text: 'Entwickle deinen personalisierten Plan' },
            { text: 'Beginne deine Arbeitsreintegrationsreise' }
          ]}
        />
      </div>
    </InvolvementPageLayout>
  )
}
