import { ReactNode } from 'react'
import { ContactLink } from '@/components/ui/contact-link'
import { HeroBanner } from '@/components/ui/hero-banner'

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
          className="inline-block bg-white text-green-800 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300"
        >
          {ctaText}
        </a>
      </HeroBanner>

      {/* Content Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Bereit anzufangen?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-600">
            Haben Sie Fragen oder möchten Sie mehr erfahren? Wir sind da, um Ihnen beim nächsten Schritt zu helfen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ContactLink variant="default" size="lg">
              Kontaktieren Sie uns
            </ContactLink>
            <a
              href="/get-involved"
              className="bg-transparent border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
            >
              Andere Optionen erkunden
            </a>
          </div>
        </div>
      </section>
    </main>
  )
} 