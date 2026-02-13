import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { BenefitCard, BenefitCardGrid } from '@/components/community/BenefitCard'
import { InfoSection, NumberedSteps, Callout } from '@/components/community/InfoSection'
import { PageSection } from '@/components/community/PageSection'
import { WORK_REINTEGRATION_PAGE } from '@/config/community'
import { responsiveTypography } from '@/lib/responsive'

export const metadata: Metadata = {
  title: 'Arbeitsreintegration | RevampIT',
  description: 'Nehmen Sie an unserem Arbeitsreintegrationsprogramm teil, um wertvolle Fähigkeiten und Erfahrungen in der Technologie zu sammeln und dabei Ihre Karriere wieder aufzubauen.'
}

export default function WorkReintegrationPage() {
  return (
    <InvolvementPageLayout
      title="Arbeitsreintegrationsprogramm"
      description="Schliessen Sie sich unserem unterstützenden Programm an, um Ihre Karriere in Technologie und Nachhaltigkeit wieder aufzubauen."
      ctaText="Ihre Reise beginnen"
      ctaHref="mailto:empfang@revamp-it.ch"
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <PageSection
          title={WORK_REINTEGRATION_PAGE.overview.title}
          content={WORK_REINTEGRATION_PAGE.overview.content}
        />

        {/* Benefits Section */}
        <section className="space-y-8">
          <h2 className={`${responsiveTypography.section} font-bold text-gray-900`}>
            Programmvorteile
          </h2>
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

        {/* Success Stories */}
        <section className="space-y-6">
          <h2 className={`${responsiveTypography.section} font-bold text-gray-900`}>
            Erfolgsgeschichten
          </h2>
          <p className={`${responsiveTypography.lead} text-gray-600 leading-relaxed`}>
            Viele unserer Teilnehmer sind erfolgreich in eine Vollzeitbeschäftigung in
            der Technologie und verwandten Bereichen übergegangen. Ihr Erfolg ist ein Zeugnis für die Wirksamkeit
            unseres Programms und das Engagement unseres Teams.
          </p>
        </section>

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
          title="Wie Sie anfangen können"
          steps={[
            { text: 'Kontaktieren Sie uns, um Ihre Situation zu besprechen' },
            { text: 'Treffen Sie sich mit unserem Team für eine Bewertung' },
            { text: 'Entwickeln Sie Ihren personalisierten Plan' },
            { text: 'Beginnen Sie Ihre Arbeitsreintegrationsreise' }
          ]}
        />
      </div>
    </InvolvementPageLayout>
  )
}
