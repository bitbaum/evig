import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { BenefitCard, BenefitCardGrid } from '@/components/community/BenefitCard'
import { InfoSection, NumberedSteps, Callout } from '@/components/community/InfoSection'
import { PageSection } from '@/components/community/PageSection'
import { INTERNSHIPS_PAGE } from '@/config/community'
import { responsiveTypography } from '@/lib/responsive'
import { ORG, CONTACT } from '@/config/org'
import Heading from '@/components/ui/Heading'

export const metadata: Metadata = {
  title: `Praktika | ${ORG.name}`,
  description: 'Sammle praktische Erfahrungen in Technologie und Nachhaltigkeit durch unser Praktikumsprogramm.',
}

export default function InternshipsPage() {
  return (
    <InvolvementPageLayout
      title="Praktikumsmöglichkeiten"
      description="Sammle wertvolle Erfahrungen in Technologie und Nachhaltigkeit und bewirke echte Veränderungen."
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
          <Heading level={2} className={`${responsiveTypography.section} text-gray-900`}>
            Programmvorteile
          </Heading>
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
          title="Wie du sich bewerben"
          steps={[
            { text: 'Sende uns deinen Lebenslauf und ein Anschreiben' },
            { text: 'Gib deinen Interessensbereich und deine Verfügbarkeit an' },
            { text: 'Führe ein kurzes Gespräch' },
            { text: 'Beginne deine Praktikumsreise!' }
          ]}
        />
      </div>
    </InvolvementPageLayout>
  )
}
