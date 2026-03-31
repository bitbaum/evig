import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { BenefitCard, BenefitCardGrid } from '@/components/community/BenefitCard'
import { InfoSection, NumberedSteps, Callout } from '@/components/community/InfoSection'
import { PageSection } from '@/components/community/PageSection'
import { VOLUNTEER_PAGE } from '@/config/community'
import { responsiveTypography } from '@/lib/responsive'
import { ORG, CONTACT } from '@/config/org'

export const metadata: Metadata = {
  title: `Freiwilligenarbeit | ${ORG.name}`,
  description: 'Schliessen Sie sich unserem Team engagierter Freiwilliger an und bewirken Sie etwas in Ihrer Gemeinschaft durch Technologie und Nachhaltigkeit.',
}

export default function VolunteerPage() {
  return (
    <InvolvementPageLayout
      title="Freiwilliger werden"
      description="Schliessen Sie sich unserem Team engagierter Freiwilliger an und helfen Sie, Technologie nachhaltig und für alle zugänglich zu machen."
      ctaText="Freiwilligenarbeit beginnen"
      ctaHref={`mailto:${CONTACT.email}`}
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <PageSection
          title={VOLUNTEER_PAGE.overview.title}
          content={VOLUNTEER_PAGE.overview.content}
        />

        {/* Benefits Section */}
        <section className="space-y-8">
          <h2 className={`${responsiveTypography.section} font-bold text-gray-900`}>
            Vorteile der Freiwilligenarbeit
          </h2>
          <BenefitCardGrid>
            {VOLUNTEER_PAGE.benefits?.map((benefit, index) => (
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
        {VOLUNTEER_PAGE.sections?.map((section, index) => (
          <InfoSection
            key={index}
            title={section.title}
            items={section.items}
            description={index === 1 ? 'Wir verstehen, dass jeder unterschiedliche Zeitpläne hat. Wir bieten flexible Freiwilligentätigkeiten, die sich an Ihre anderen Verpflichtungen anpassen lassen. Ob Sie ein paar Stunden pro Woche oder mehr erhübrigen können - Ihr Beitrag wird einen Unterschied machen.' : undefined}
          />
        ))}

        {/* Callouts from config */}
        {VOLUNTEER_PAGE.callouts?.map((callout, index) => (
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
            { text: 'Kontaktieren Sie uns, um Ihr Interesse zu bekunden' },
            { text: 'Treffen Sie sich mit unserem Team, um Ihre Fähigkeiten und Interessen zu besprechen' },
            { text: 'Nehmen Sie an einer kurzen Einführungssitzung teil' },
            { text: 'Beginnen Sie, einen Unterschied zu machen!' }
          ]}
        />
      </div>
    </InvolvementPageLayout>
  )
} 