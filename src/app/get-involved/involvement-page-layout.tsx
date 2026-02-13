import { ReactNode } from 'react'
import { ContactLink } from '@/components/ui/contact-link'
import { HeroBanner } from '@/components/ui/hero-banner'
import { responsiveTypography, responsiveSpacing, responsiveButtons } from '@/lib/responsive'

interface InvolvementPageLayoutProps {
  title: string
  description: string
  children: ReactNode
  ctaText: string
  ctaHref: string
}

export function InvolvementPageLayout({
  title,
  description,
  children,
  ctaText,
  ctaHref
}: InvolvementPageLayoutProps) {
  return (
    <main className="min-h-screen">
      <HeroBanner title={title} description={description}>
        <a
          href={ctaHref}
          className={`${responsiveButtons.primary} bg-white text-green-800 hover:bg-green-50 text-center`}
        >
          {ctaText}
        </a>
      </HeroBanner>

      {/* Content Section */}
      <section className={responsiveSpacing.section}>
        <div className={`${responsiveSpacing.container} mx-auto`}>
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`${responsiveSpacing.section} bg-gray-50`}>
        <div className={`${responsiveSpacing.container} mx-auto text-center`}>
          <h2 className={`${responsiveTypography.section} font-bold ${responsiveSpacing.mbMedium}`}>
            Bereit anzufangen?
          </h2>
          <p className={`${responsiveTypography.lead} ${responsiveSpacing.mbLarge} max-w-2xl mx-auto text-gray-600`}>
            Haben Sie Fragen oder möchten Sie mehr erfahren? Wir sind da, um Ihnen beim nächsten Schritt zu helfen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <ContactLink variant="default" size="lg">
              Kontaktieren Sie uns
            </ContactLink>
            <a
              href="/get-involved"
              className={`${responsiveButtons.large} bg-transparent border-2 border-green-600 text-green-600 hover:bg-green-50`}
            >
              Andere Optionen erkunden
            </a>
          </div>
        </div>
      </section>
    </main>
  )
} 