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
  description: 'Schliess dich unserem Team engagierter Freiwilliger an und bewirke etwas in deiner Gemeinschaft durch Technologie und Nachhaltigkeit.',
}

export default function VolunteerPage() {
  return (
    <InvolvementPageLayout
      title="Freiwilliger werden"
      description="Schliess dich unserem Team engagierter Freiwilliger an und hilf, Technologie nachhaltig und für alle zugänglich zu machen."
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
            description={index === 1 ? 'Wir verstehen, dass jeder unterschiedliche Zeitpläne hat. Wir bieten flexible Freiwilligentätigkeiten, die sich an deine anderen Verpflichtungen anpassen lassen. Ob du ein paar Stunden pro Woche oder mehr erübrigen kannst - dein Beitrag wird einen Unterschied machen.' : undefined}
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
          title="Wie du anfangen können"
          steps={[
            { text: 'Kontaktiere uns, um dein Interesse zu bekunden' },
            { text: 'Triff sich mit unserem Team, um deine Fähigkeiten und Interessen zu besprechen' },
            { text: 'Nimm an einer kurzen Einführungssitzung teil' },
            { text: 'Beginne, einen Unterschied zu machen!' }
          ]}
        />
      </div>
    </InvolvementPageLayout>
  )
} 