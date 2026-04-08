import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { BenefitCard, BenefitCardGrid } from '@/components/community/BenefitCard'
import { InfoSection, NumberedSteps, Callout } from '@/components/community/InfoSection'
import { PageSection } from '@/components/community/PageSection'
import { TECHNICAL_EXPERTS_PAGE } from '@/config/community'
import { responsiveTypography } from '@/lib/responsive'
import { ORG, CONTACT } from '@/config/org'

export const metadata: Metadata = {
  title: `Technische Experten | ${ORG.name}`,
  description: 'Teile deine technische Expertise und hilf uns, innovative Lösungen für nachhaltige Technologie zu entwickeln.',
}

export default function TechnicalExpertsPage() {
  return (
    <InvolvementPageLayout
      title="Technische Experten"
      description="Teile deine Expertise und hilf uns, innovative Lösungen für nachhaltige Technologie zu entwickeln."
      ctaText="deine Expertise teilen"
      ctaHref={`mailto:${CONTACT.email}`}
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
          title="Wie du anfangen können"
          steps={[
            { text: 'Kontaktiere uns mit deinem Fachbereich und deinen Interessen' },
            { text: 'Besprich mögliche Projekte und Beiträge' },
            { text: 'Überprüfe unsere Entwicklungsrichtlinien und -prozesse' },
            { text: 'Beginne, zu unseren Projekten beizutragen' }
          ]}
        />
      </div>
    </InvolvementPageLayout>
  )
}
