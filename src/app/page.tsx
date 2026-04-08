import { Recycle, Store, Wrench, BookOpen, Heart, Users, Award, Gift } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCompactMetrics } from '@/data/impact-metrics'
import AsSeenInLogos from '@/components/about/AsSeenInLogos'
import Heading from '@/components/ui/Heading'
import { PageHero } from '@/components/layout/PageHero'
import { NewsletterSignup } from '@/components/community/NewsletterSignup'
import { CommunityStats } from '@/components/community/CommunityStats'
import { ORG, CONTACT, LOCATIONS, OPENING_HOURS } from '@/config/org'

export const metadata: Metadata = {
  title: `${ORG.name} – Alte Hardware. Neues Leben. | Computer-Reparatur & Linux in der Schweiz`,
  description: 'Gebrauchte IT kaufen & verkaufen. Computer-Reparatur durch Freiwillige. Workshops zu Linux, Hardware und Programmierung. RevampIT — die Schweizer Community für nachhaltige Technologie.',
  keywords: ['Computer Reparatur Schweiz', 'Linux Installation', 'Datenrettung', 'Vintage Computer', 'Open Source', 'nachhaltige IT', 'Zürich', 'Basel', 'Luzern', 'refurbished Computer'],
  openGraph: {
    title: `${ORG.name} – Alte Hardware. Neues Leben.`,
    description: 'Gebrauchte IT kaufen & verkaufen. Computer-Reparatur durch Freiwillige. Workshops zu Linux, Hardware und Programmierung.',
    type: 'website',
    locale: 'de_CH',
    url: ORG.website,
    siteName: ORG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${ORG.name} – Alte Hardware. Neues Leben.`,
    description: 'Gebrauchte IT kaufen & verkaufen. Computer-Reparatur durch Freiwillige. Workshops zu Linux, Hardware und Programmierung.',
  },
}

export default function Home() {
  const compactMetrics = getCompactMetrics()

  return (
    <div className="bg-white">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": ORG.name,
            "description": "Computer-Reparatur, Linux-Installation und Datenrettung. Nachhaltige IT-Lösungen für Privatpersonen, Vereine und KMU.",
            "url": ORG.website,
            "telephone": CONTACT.phone,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": LOCATIONS.store.street,
              "postalCode": LOCATIONS.store.postalCode,
              "addressLocality": LOCATIONS.store.city,
              "addressRegion": "ZH",
              "addressCountry": "CH"
            },
            "areaServed": ["Zürich", "Basel", "Luzern", "Schweiz"],
            "priceRange": "$$",
            "openingHours": OPENING_HOURS.schemaOrg,
            "sameAs": [
              "https://twitter.com/revampit",
              "https://linkedin.com/company/revampit"
            ],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "IT Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Linux-Installation",
                    "description": "Alte Laptops schneller gemacht durch Linux-Installation"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Datenrettung",
                    "description": "Wiederherstellung von Daten aus beschädigten Geräten"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Computer-Reparatur",
                    "description": "Reparatur und Aufbau von Vintage-Computern"
                  }
                }
              ]
            }
          })
        }}
      />

      {/* Section 1: Hero */}
      <PageHero
        theme="home"
        icon={Recycle}
        title="Alte Hardware. Neues Leben."
        subtitle="Ihr alter Computer verdient ein zweites Leben. Verkaufen Sie gebrauchte Geräte, lassen Sie defekte Hardware reparieren, oder lernen Sie in unseren Workshops."
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-x-6">
          <Link
            href="#actions"
            className="w-full sm:w-auto rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 text-center"
          >
            Loslegen
          </Link>
          <Link href="/about" className="text-sm font-semibold leading-6 text-gray-900">
            Mehr über uns <span aria-hidden="true">→</span>
          </Link>
        </div>
      </PageHero>

      {/* Section 2: Three Action Cards */}
      <div id="actions" className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <Heading level={2} className="tracking-tight text-gray-900">
              Was möchten Sie tun?
            </Heading>
          </div>

          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            {/* Card 1: Sell/Buy */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 mb-4" aria-hidden="true">
                <Store className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Altes Gerät übrig?</h3>
              <p className="mt-2 text-base text-gray-600 flex-1">
                Verkaufen oder verschenken Sie es in 2 Minuten
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/marketplace"
                  className="flex-1 rounded-md bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white text-center shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                >
                  Inserate durchsuchen
                </Link>
                <Link
                  href="/marketplace/sell"
                  className="flex-1 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-orange-600 text-center border border-orange-600 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                >
                  Jetzt verkaufen
                </Link>
              </div>
            </div>

            {/* Card 2: Repair */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 mb-4" aria-hidden="true">
                <Wrench className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Computer kaputt?</h3>
              <p className="mt-2 text-base text-gray-600 flex-1">
                Freiwillige Techniker in Ihrer Nähe helfen
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/it-hilfe"
                  className="flex-1 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white text-center shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  Hilfe finden
                </Link>
                <Link
                  href="/profil/skills"
                  className="flex-1 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-emerald-600 text-center border border-emerald-600 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  Selbst helfen
                </Link>
              </div>
            </div>

            {/* Card 3: Learn */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 mb-4" aria-hidden="true">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Etwas Neues lernen?</h3>
              <p className="mt-2 text-base text-gray-600 flex-1">
                Workshops zu Linux, Hardware, Programmierung und KI
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/workshops"
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white text-center shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Workshops ansehen
                </Link>
                <Link
                  href="/workshops/propose"
                  className="flex-1 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 text-center border border-blue-600 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Workshop vorschlagen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Social Proof */}
      <div className="bg-gray-50 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Media Logos */}
          <AsSeenInLogos />

          {/* Community Stats */}
          <CommunityStats className="mt-6" />

          {/* Impact Metrics (compact) */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <dl className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3">
              {compactMetrics.map((metric, index) => (
                <div key={index} className="text-center">
                  <dd className="text-2xl sm:text-3xl font-bold text-green-600">{metric.value}</dd>
                  <dt className="mt-1 text-xs sm:text-sm text-gray-600">{metric.label}</dt>
                </div>
              ))}
            </dl>
            <div className="mt-6 text-center">
              <Link
                href="/about/impact"
                className="text-sm font-semibold text-green-600 hover:text-green-700"
              >
                Mehr über unsere Wirkung <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: How to Get Involved */}
      <div className="bg-green-50 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <Heading level={2} className="tracking-tight text-gray-900">
              Werden Sie Teil der Community
            </Heading>
          </div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Nutzen */}
            <Link
              href="/auth/register"
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 mb-4" aria-hidden="true">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">Nutzen</h3>
              <p className="mt-2 text-sm text-gray-600">
                Kaufen, verkaufen, reparieren — kostenlos
              </p>
            </Link>

            {/* Mithelfen */}
            <Link
              href="/profil/skills"
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 mb-4" aria-hidden="true">
                <Heart className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Mithelfen</h3>
              <p className="mt-2 text-sm text-gray-600">
                Teilen Sie Ihr Wissen als Freiwilliger
              </p>
            </Link>

            {/* Unterstützen */}
            <Link
              href="/get-involved/donate"
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 mb-4" aria-hidden="true">
                <Gift className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">Unterstützen</h3>
              <p className="mt-2 text-sm text-gray-600">
                Spenden Sie Geräte oder Geld
              </p>
            </Link>

            {/* Mitglied werden */}
            <Link
              href="/mitglied-werden"
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 mb-4" aria-hidden="true">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">Mitglied werden</h3>
              <p className="mt-2 text-sm text-gray-600">
                Gestalten Sie den Verein mit
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Section 5: Newsletter */}
      <div className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <NewsletterSignup
            title="Bleiben Sie informiert"
            description="Erfahren Sie, wie wir Technologie nachhaltig machen — kein Spam."
            source="homepage-footer"
          />
        </div>
      </div>
    </div>
  )
}
