import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { BenefitCard, BenefitCardGrid } from '@/components/community/BenefitCard'
import { InfoSection, NumberedSteps, Callout } from '@/components/community/InfoSection'
import { PageSection } from '@/components/community/PageSection'
import { IT_HILFE_TECHNIKER_PAGE } from '@/config/community'
import { responsiveTypography } from '@/lib/responsive'
import { ORG } from '@/config/org'
import Heading from '@/components/ui/Heading'

export const metadata: Metadata = {
  title: `IT-Hilfe Techniker | ${ORG.name}`,
  description: 'Teile dein IT-Wissen und hilf Menschen in deiner Gemeinschaft — flexibel, ohne Vorkenntnisse und mit echter Wirkung.',
}

export default function ITHilfeTechnikerPage() {
  return (
    <InvolvementPageLayout
      title="IT-Hilfe Techniker werden"
      description="Dein IT-Wissen kann anderen das Leben leichtern. Hilf Menschen in der Gemeinschaft mit ihren Computern — flexibel, unkompliziert, wirkungsvoll."
      ctaText="Als Techniker registrieren"
      ctaHref="/profil/techniker"
    >
      <div className="space-y-16">
        {/* Overview */}
        <PageSection
          title={IT_HILFE_TECHNIKER_PAGE.overview.title}
          content={IT_HILFE_TECHNIKER_PAGE.overview.content}
        />

        {/* Benefits */}
        <section className="space-y-8">
          <Heading level={2} className={`${responsiveTypography.section} text-gray-900`}>
            Was du davon hast
          </Heading>
          <BenefitCardGrid>
            {IT_HILFE_TECHNIKER_PAGE.benefits?.map((benefit, index) => (
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
        {IT_HILFE_TECHNIKER_PAGE.sections?.map((section, index) => (
          <InfoSection
            key={index}
            title={section.title}
            items={section.items}
          />
        ))}

        {/* Callouts */}
        {IT_HILFE_TECHNIKER_PAGE.callouts?.map((callout, index) => (
          <Callout
            key={index}
            title={callout.title}
            content={callout.content}
          />
        ))}

        {/* How to get started */}
        <NumberedSteps
          title="Wie du anfangen kannst"
          steps={[
            { text: 'Erstelle dein Techniker-Profil mit deinen Fähigkeiten und Verfügbarkeit' },
            { text: 'Warte auf Anfragen — du entscheidest, welche du annimmst' },
            { text: 'Vereinbare einen Termin direkt mit der anfragenden Person' },
            { text: 'Hilf, lerne, mach einen Unterschied' },
          ]}
        />
      </div>
    </InvolvementPageLayout>
  )
}
