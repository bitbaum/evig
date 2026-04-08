import { Metadata } from 'next'
import Link from 'next/link'
import { Code } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { ValuesSection } from './sections/ValuesSection'
import { PhilosophySection } from './sections/PhilosophySection'
import { ServicesSection } from './sections/ServicesSection'
import { WhyOpenSourceSection } from './sections/WhyOpenSourceSection'
import { TechnologiesSection } from './sections/TechnologiesSection'
import { BenefitsSection } from './sections/BenefitsSection'
import { ProcessSection } from './sections/ProcessSection'
import { CTASection } from './sections/CTASection'

export const metadata: Metadata = {
  title: 'Webdesign & Entwicklung | RevampIT',
  description: 'Professionelle Webdesign- und Entwicklungsdienstleistungen mit Open-Source-Technologien. Moderne, responsive Websites, die auf Nachhaltigkeit und Leistung ausgelegt sind.',
  openGraph: {
    title: 'Webdesign & Entwicklung | RevampIT',
    description: 'Professionelle Webdesign- und Entwicklungsdienstleistungen mit Open-Source-Technologien. Moderne, responsive Websites, die auf Nachhaltigkeit und Leistung ausgelegt sind.',
    type: 'website',
    url: 'https://revampit.org/services/web-design-development',
  },
}

export default function WebDesignDevelopmentPage() {
  return (
    <main>
      <PageHero
        theme="services"
        icon={Code}
        title="Webdesign & Entwicklung"
        subtitle="100% Engagement für Freiheit durch Open Source, Dezentralisierung, Datenschutz, Dateneigentum, Code-Eigentum und maximale Automatisierung. Wir schaffen digitale Erlebnisse, bei denen Anstrengung zur Wahl und nicht zur Notwendigkeit wird."
      >
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Starte Ihr Projekt
          </Link>
          <Link
            href="#services"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium px-6 py-3 bg-white text-blue-600 hover:bg-gray-50 border-2 border-blue-600 transition-colors"
          >
            Dienstleistungen entdecken
          </Link>
        </div>
      </PageHero>

      <ValuesSection />
      <PhilosophySection />
      <ServicesSection />
      <WhyOpenSourceSection />
      <TechnologiesSection />
      <BenefitsSection />
      <ProcessSection />
      <CTASection />
    </main>
  )
}
