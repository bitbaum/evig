import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { BenefitCard, BenefitCardGrid } from '@/components/community/BenefitCard'
import { InfoSection, NumberedSteps, Callout } from '@/components/community/InfoSection'
import { PageSection } from '@/components/community/PageSection'
import { PARTNERSHIPS_PAGE } from '@/config/community'
import { responsiveTypography } from '@/lib/responsive'
import { ORG, CONTACT } from '@/config/org'

export const metadata: Metadata = {
  title: `Partnerschaften | ${ORG.name}`,
  description: `Schliessen Sie sich mit ${ORG.name} zusammen, um nachhaltige Technologielösungen zu schaffen und eine dauerhafte Wirkung zu erzielen.`,
}

export default function PartnershipsPage() {
  return (
    <InvolvementPageLayout
      title="Partnerschaftsmöglichkeiten"
      description={`Schliessen Sie sich mit ${ORG.name} zusammen, um nachhaltige Technologielösungen zu schaffen und eine dauerhafte Wirkung zu erzielen.`}
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
          <h2 className={`${responsiveTypography.section} font-bold text-gray-900`}>
            Partnerschaftsvorteile
          </h2>
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
          title="Wie Sie anfangen können"
          steps={[
            { text: 'Kontaktieren Sie uns, um Partnerschaftsmöglichkeiten zu besprechen' },
            { text: 'Teilen Sie die Ziele und Interessen Ihrer Organisation mit' },
            { text: 'Erkunden Sie potenzielle Zusammenarbeitsbereiche' },
            { text: 'Entwickeln Sie eine Partnerschaftsvereinbarung' },
            { text: 'Beginnen Sie Ihre Partnerschaftsreise' }
          ]}
        />
      </div>
    </InvolvementPageLayout>
  )
}
