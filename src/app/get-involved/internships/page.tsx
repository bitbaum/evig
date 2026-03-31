import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { BenefitCard, BenefitCardGrid } from '@/components/community/BenefitCard'
import { InfoSection, NumberedSteps, Callout } from '@/components/community/InfoSection'
import { PageSection } from '@/components/community/PageSection'
import { INTERNSHIPS_PAGE } from '@/config/community'
import { responsiveTypography } from '@/lib/responsive'
import { ORG, CONTACT } from '@/config/org'

export const metadata: Metadata = {
  title: `Praktika | ${ORG.name}`,
  description: 'Sammeln Sie praktische Erfahrungen in Technologie und Nachhaltigkeit durch unser Praktikumsprogramm.',
}

export default function InternshipsPage() {
  return (
    <InvolvementPageLayout
      title="Praktikumsmöglichkeiten"
      description="Sammeln Sie wertvolle Erfahrungen in Technologie und Nachhaltigkeit und bewirken Sie echte Veränderungen."
      ctaText="Für Praktikum bewerben"
      ctaHref={`mailto:${CONTACT.email}`}
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <PageSection
          title={INTERNSHIPS_PAGE.overview.title}
          content={INTERNSHIPS_PAGE.overview.content}
        />

        {/* Benefits Section */}
        <section className="space-y-8">
          <h2 className={`${responsiveTypography.section} font-bold text-gray-900`}>
            Programmvorteile
          </h2>
          <BenefitCardGrid>
            {INTERNSHIPS_PAGE.benefits?.map((benefit, index) => (
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
        {INTERNSHIPS_PAGE.sections?.map((section, index) => (
          <InfoSection
            key={index}
            title={section.title}
            items={section.items}
          />
        ))}

        {/* Callouts from config */}
        {INTERNSHIPS_PAGE.callouts?.map((callout, index) => (
          <Callout
            key={index}
            title={callout.title}
            content={callout.content}
          />
        ))}

        {/* How to Apply */}
        <NumberedSteps
          title="Wie Sie sich bewerben"
          steps={[
            { text: 'Senden Sie uns Ihren Lebenslauf und ein Anschreiben' },
            { text: 'Geben Sie Ihren Interessensbereich und Ihre Verfügbarkeit an' },
            { text: 'Führen Sie ein kurzes Gespräch' },
            { text: 'Beginnen Sie Ihre Praktikumsreise!' }
          ]}
        />
      </div>
    </InvolvementPageLayout>
  )
}
