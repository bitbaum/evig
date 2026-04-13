import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { BenefitCard, BenefitCardGrid } from '@/components/community/BenefitCard'
import { InfoSection, NumberedSteps, Callout } from '@/components/community/InfoSection'
import { PageSection } from '@/components/community/PageSection'
import { PARTNERSHIPS_PAGE } from '@/config/community'
import { responsiveTypography } from '@/lib/responsive'
import { ORG, CONTACT } from '@/config/org'
import Heading from '@/components/ui/Heading'

export const metadata: Metadata = {
  title: `Partnerschaften | ${ORG.name}`,
  description: `Schliess dich mit ${ORG.name} zusammen, um nachhaltige Technologielösungen zu schaffen und eine dauerhafte Wirkung zu erzielen.`,
}

export default function PartnershipsPage() {
  return (
    <InvolvementPageLayout
      title="Partnerschaftsmöglichkeiten"
      description={`Schliess dich mit ${ORG.name} zusammen, um nachhaltige Technologielösungen zu schaffen und eine dauerhafte Wirkung zu erzielen.`}
      ctaText="Partner werden"
      ctaHref={`mailto:${CONTACT.email}`}
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <PageSection
          title={PARTNERSHIPS_PAGE.overview.title}
          content={PARTNERSHIPS_PAGE.overview.content}
        />

        {/* Benefits Section */}
        <section className="space-y-8">
          <Heading level={2} className={`${responsiveTypography.section} text-gray-900`}>
            Partnerschaftsvorteile
          </Heading>
          <BenefitCardGrid>
            {PARTNERSHIPS_PAGE.benefits?.map((benefit, index) => (
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
        {PARTNERSHIPS_PAGE.sections?.map((section, index) => (
          <InfoSection
            key={index}
            title={section.title}
            items={section.items}
          />
        ))}

        {/* Callouts from config */}
        {PARTNERSHIPS_PAGE.callouts?.map((callout, index) => (
          <Callout
            key={index}
            title={callout.title}
            content={callout.content}
          />
        ))}

        {/* Partnership Process */}
        <NumberedSteps
          title="Wie wir zusammenarbeiten"
          steps={[
            { text: 'Erste Beratung zum Verständnis von Zielen und Möglichkeiten' },
            { text: 'Entwicklung von Partnerschaftsrahmen und -zielen' },
            { text: 'Umsetzung von kooperativen Initiativen' },
            { text: 'Regelmässige Fortschrittsüberprüfungen und Wirkungsbewertung' },
            { text: 'Kontinuierliche Verbesserung und Erweiterung der Partnerschaft' }
          ]}
        />

        {/* How to Get Started */}
        <NumberedSteps
          title="Wie du anfangen kannst"
          steps={[
            { text: 'Kontaktiere uns, um Partnerschaftsmöglichkeiten zu besprechen' },
            { text: 'Teile die Ziele und Interessen deiner Organisation mit' },
            { text: 'Erkunde potenzielle Zusammenarbeitsbereiche' },
            { text: 'Entwickle eine Partnerschaftsvereinbarung' },
            { text: 'Beginne deine Partnerschaftsreise' }
          ]}
        />
      </div>
    </InvolvementPageLayout>
  )
}
