import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { BenefitCard, BenefitCardGrid } from '@/components/community/BenefitCard'
import { InfoSection, NumberedSteps, Callout } from '@/components/community/InfoSection'
import { PageSection } from '@/components/community/PageSection'
import { DONATE_PAGE } from '@/config/community'
import { responsiveTypography } from '@/lib/responsive'

export const metadata: Metadata = {
  title: 'Spenden | RevampIT',
  description: 'Unterstützen Sie unsere Mission, Technologie nachhaltig und für alle zugänglich zu machen.'
}

export default function DonatePage() {
  return (
    <InvolvementPageLayout
      title="Unterstützen Sie unsere Mission"
      description="Ihre Spende hilft uns, Technologie nachhaltig und für alle zugänglich zu machen."
      ctaText="Spende tätigen"
      ctaHref="mailto:empfang@revamp-it.ch"
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <PageSection
          title={DONATE_PAGE.overview.title}
          content={DONATE_PAGE.overview.content}
        />

        {/* Impact Areas Section */}
        <section className="space-y-8">
          <h2 className={`${responsiveTypography.section} font-bold text-gray-900`}>
            Wie Ihre Spende hilft
          </h2>
          <BenefitCardGrid>
            {DONATE_PAGE.benefits?.map((benefit, index) => (
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
        {DONATE_PAGE.sections?.map((section, index) => (
          <InfoSection
            key={index}
            title={section.title}
            items={section.items}
            description={index === 2 ? 'Wir bieten spezielle Programme für Unternehmensspender, einschliesslich:' : undefined}
          />
        ))}

        {/* Callouts from config */}
        {DONATE_PAGE.callouts?.map((callout, index) => (
          <Callout
            key={index}
            title={callout.title}
            content={callout.content}
          />
        ))}

        {/* How to Donate */}
        <NumberedSteps
          title="Wie Sie spenden können"
          steps={[
            { text: 'Kontaktieren Sie uns, um Ihre Spende zu besprechen' },
            { text: 'Wählen Sie Ihre bevorzugte Spendmethode' },
            { text: 'Schliessen Sie Ihre Spende ab' },
            { text: 'Erhalten Sie Bestätigung und Wirkungsupdates' }
          ]}
        />
      </div>
    </InvolvementPageLayout>
  )
}
