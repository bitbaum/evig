import { Metadata } from 'next'
import { ResponsiveHero } from '@/components/layout/ResponsiveHero'
import { BenefitsSection } from './components/BenefitsSection'
import { ServicesSection } from './components/ServicesSection'
import { ComparisonSection } from './components/ComparisonSection'
import { CTASection } from './components/CTASection'
import { getTextColor } from '@/lib/design-system'
import { cn } from '@/lib/utils'
import {
  benefits,
  popularApps,
  features,
  consumerComparisons,
  businessComparisons,
  emergingTechComparisons
} from './data'

export const metadata: Metadata = {
  title: 'Open-Source-Lösungen',
  description: 'Professionelle Implementierung, Unterstützung und Schulung für Open-Source-Software für Unternehmen und Privatpersonen.',
}

export default function OpenSourceSolutionsPage() {
  return (
    <main>
      {/* Hero Section */}
      <ResponsiveHero
        title="Open-Source-Lösungen"
        description="Professionelle Implementierung von Open-Source-Software, die proprietären Alternativen entspricht oder diese übertrifft."
        backgroundColor="green"
      />

      {/* Benefits Section */}
      <BenefitsSection benefits={benefits} />

      {/* Services Section */}
      <ServicesSection features={features} />

      {/* CTA Section */}
      <CTASection />

      {/* Verification Note */}
      <div className="bg-surface-raised py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className={cn('text-sm', getTextColor('neutral', 'muted'))}>
            Alle bereitgestellten Informationen sind zum {new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long' })} korrekt.
            Wir aktualisieren unsere Inhalte regelmässig, um die neuesten Entwicklungen in der Open-Source-Software widerzuspiegeln.
          </p>
        </div>
      </div>

      {/* Comparison Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-surface-base">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
            <h2 className={cn('text-3xl font-bold mb-6', getTextColor('white', 'primary'))}>
              Open-Source-Lösungen
            </h2>
            <p className={cn('text-lg', getTextColor('white', 'muted'))}>
              Entdecken Sie leistungsstarke Open-Source-Alternativen zu teurer proprietärer Software.
              Alle diese Lösungen sind kostenlos, werden regelmässig aktualisiert und von der Community vorangetrieben.
            </p>
          </div>

          {/* Consumer Solutions */}
          <ComparisonSection title="Lösungen für Verbraucher" comparisons={consumerComparisons} />

          {/* Business Solutions */}
          <ComparisonSection title="Lösungen für Unternehmen" comparisons={businessComparisons} />

          {/* Emerging Technologies */}
          <ComparisonSection title="Aufstrebende Technologien" comparisons={emergingTechComparisons} />
        </div>
      </section>
    </main>
  )
}
