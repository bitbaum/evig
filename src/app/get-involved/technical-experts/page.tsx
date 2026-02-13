import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { BenefitCard, BenefitCardGrid } from '@/components/community/BenefitCard'
import { InfoSection, NumberedSteps, Callout } from '@/components/community/InfoSection'
import { PageSection } from '@/components/community/PageSection'
import { TECHNICAL_EXPERTS_PAGE } from '@/config/community'
import { responsiveTypography } from '@/lib/responsive'

export const metadata: Metadata = {
  title: 'Technische Experten | RevampIT',
  description: 'Teilen Sie Ihre technische Expertise und helfen Sie uns, innovative Lösungen für nachhaltige Technologie zu entwickeln.'
}

export default function TechnicalExpertsPage() {
  return (
    <InvolvementPageLayout
      title="Technische Experten"
      description="Teilen Sie Ihre Expertise und helfen Sie uns, innovative Lösungen für nachhaltige Technologie zu entwickeln."
      ctaText="Ihre Expertise teilen"
      ctaHref="mailto:empfang@revamp-it.ch"
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <PageSection
          title={TECHNICAL_EXPERTS_PAGE.overview.title}
          content={TECHNICAL_EXPERTS_PAGE.overview.content}
        />

        {/* Opportunities Section */}
        <section className="space-y-8">
          <h2 className={`${responsiveTypography.section} font-bold text-gray-900`}>
            Möglichkeiten für technische Experten
          </h2>
          <BenefitCardGrid>
            {TECHNICAL_EXPERTS_PAGE.benefits?.map((benefit, index) => (
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
        {TECHNICAL_EXPERTS_PAGE.sections?.map((section, index) => (
          <InfoSection
            key={index}
            title={section.title}
            items={section.items}
          />
        ))}

        {/* Callouts from config */}
        {TECHNICAL_EXPERTS_PAGE.callouts?.map((callout, index) => (
          <Callout
            key={index}
            title={callout.title}
            content={callout.content}
          />
        ))}

        {/* How to Get Started */}
        <NumberedSteps
          title="Wie Sie anfangen können"
          steps={[
            { text: 'Kontaktieren Sie uns mit Ihrem Fachbereich und Ihren Interessen' },
            { text: 'Besprechen Sie mögliche Projekte und Beiträge' },
            { text: 'Überprüfen Sie unsere Entwicklungsrichtlinien und -prozesse' },
            { text: 'Beginnen Sie, zu unseren Projekten beizutragen' }
          ]}
        />
      </div>
    </InvolvementPageLayout>
  )
}
