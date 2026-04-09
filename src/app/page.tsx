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
  description: 'Gebrauchte IT kaufen & verkaufen. Computer-Reparatur durch die Community. Workshops zu Linux, Hardware und Programmierung. RevampIT — Schweizer Verein für nachhaltige Technologie.',
  keywords: ['Computer Reparatur Schweiz', 'Linux Installation', 'Datenrettung', 'Vintage Computer', 'Open Source', 'nachhaltige IT', 'Zürich', 'Basel', 'Luzern', 'refurbished Computer'],
  openGraph: {
    title: `${ORG.name} – Alte Hardware. Neues Leben.`,
    description: 'Gebrauchte IT kaufen & verkaufen. Computer-Reparatur durch die Community. Workshops zu Linux, Hardware und Programmierung.',
    type: 'website',
    locale: 'de_CH',
    url: ORG.website,
    siteName: ORG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${ORG.name} – Alte Hardware. Neues Leben.`,
    description: 'Gebrauchte IT kaufen & verkaufen. Computer-Reparatur durch die Community. Workshops zu Linux, Hardware und Programmierung.',
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
        subtitle="Jedes Jahr landen 62 Millionen Tonnen Elektrogeräte auf dem Müll. Wir ändern das — mit einer Community, die repariert, weitergibt und voneinander lernt."
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-x-6">
          <Link
            href="/marketplace"
            className="w-full sm:w-auto rounded-md bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 text-center"
          >
            Jetzt entdecken
          </Link>
          <Link href="/about" className="text-base font-semibold leading-6 text-gray-900">
            Über uns <span aria-hidden="true">→</span>
          </Link>
        </div>
      </PageHero>

      {/* Section 2: Three Action Cards */}
      <div id="actions" className="bg-gradient-to-b from-white to-gray-50 py-12 sm:py-16 lg:py-20" aria-label="Hauptaktionen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <Heading level={2} className="tracking-tight text-gray-900">
              Was möchtest du tun?
            </Heading>
          </div>

          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            {[
              {
                icon: Store,
                iconBg: 'bg-orange-100',
                iconColor: 'text-orange-600',
                title: 'Altes Gerät übrig?',
                subtitle: 'Verkaufe oder verschenke es in 2 Minuten — kostenlos und ohne Gebühren.',
                primaryLabel: 'Marktplatz entdecken',
                primaryHref: '/marketplace',
                primaryColor: 'bg-orange-600 hover:bg-orange-500 focus-visible:outline-orange-600',
                secondaryLabel: 'Jetzt verkaufen',
                secondaryHref: '/marketplace/sell',
                secondaryColor: 'text-orange-600 border-orange-600 hover:bg-orange-50 focus-visible:outline-orange-600',
              },
              {
                icon: Wrench,
                iconBg: 'bg-emerald-100',
                iconColor: 'text-emerald-600',
                title: 'Computer kaputt?',
                subtitle: 'Techniker in deiner Nähe helfen — oder biete selbst Reparaturen an.',
                primaryLabel: 'Hilfe finden',
                primaryHref: '/it-hilfe',
                primaryColor: 'bg-emerald-600 hover:bg-emerald-500 focus-visible:outline-emerald-600',
                secondaryLabel: 'Techniker werden',
                secondaryHref: '/profil/techniker',
                secondaryColor: 'text-emerald-600 border-emerald-600 hover:bg-emerald-50 focus-visible:outline-emerald-600',
              },
              {
                icon: BookOpen,
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
                title: 'Etwas Neues lernen?',
                subtitle: 'Praxisnahe Workshops zu Linux, Hardware-Reparatur, Programmierung und KI.',
                primaryLabel: 'Workshops ansehen',
                primaryHref: '/workshops',
                primaryColor: 'bg-blue-600 hover:bg-blue-500 focus-visible:outline-blue-600',
                secondaryLabel: 'Knowhow entdecken',
                secondaryHref: '/knowhow',
                secondaryColor: 'text-blue-600 border-blue-600 hover:bg-blue-50 focus-visible:outline-blue-600',
              },
            ].map((card) => (
              <div key={card.title} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} mb-4`} aria-hidden="true">
                  <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <Heading level={3} className="text-xl sm:text-2xl font-bold text-gray-900">{card.title}</Heading>
                <p className="mt-2 text-base text-gray-600 flex-1">
                  {card.subtitle}
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link
                    href={card.primaryHref}
                    className={`flex-1 rounded-md ${card.primaryColor} px-4 py-3 text-base font-semibold text-white text-center shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                  >
                    {card.primaryLabel}
                  </Link>
                  <Link
                    href={card.secondaryHref}
                    className={`flex-1 rounded-md bg-white px-4 py-3 text-base font-semibold ${card.secondaryColor} text-center border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                  >
                    {card.secondaryLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2b: Professional Services (brief mention) */}
      <div className="bg-white py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-base text-gray-600">
            Wir bieten auch professionelle{' '}
            <Link href="/services" className="font-semibold text-green-600 hover:text-green-700 underline underline-offset-2">
              IT-Dienstleistungen
            </Link>
            {' '}an: Computer-Reparatur, Datenrettung, Linux-Installation und Webentwicklung.
          </p>
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
              Werde Teil der Community
            </Heading>
            <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Ob nutzen, mithelfen oder unterstützen — jeder Beitrag zählt.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, iconBg: 'bg-green-100', iconColor: 'text-green-600', hoverColor: 'group-hover:text-green-600', title: 'Nutzen', desc: 'Kaufen, verkaufen, reparieren — kostenlos', href: '/auth/register', border: 'border-gray-200' },
              { icon: Heart, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', hoverColor: 'group-hover:text-blue-600', title: 'Mithelfen', desc: 'Teile dein Wissen als freiwilliger Techniker', href: '/get-involved/volunteer', border: 'border-gray-200' },
              { icon: Gift, iconBg: 'bg-orange-100', iconColor: 'text-orange-600', hoverColor: 'group-hover:text-orange-600', title: 'Unterstützen', desc: 'Spende Geräte oder Geld für den Verein', href: '/get-involved/donate', border: 'border-gray-200' },
              { icon: Award, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', hoverColor: 'group-hover:text-purple-600', title: 'Mitglied werden', desc: 'Stimme mit und gestalte den Verein aktiv', href: '/mitglied-werden', border: 'border-purple-300 ring-1 ring-purple-200' },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={`bg-white rounded-xl p-6 border ${item.border} hover:shadow-md transition-shadow group`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.iconBg} mb-4`} aria-hidden="true">
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <Heading level={3} className={`text-lg font-bold text-gray-900 ${item.hoverColor} transition-colors`}>{item.title}</Heading>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Section 5: Newsletter */}
      <div className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <NewsletterSignup
            title="Bleib auf dem Laufenden"
            description="Erfahre, wie wir Technologie nachhaltig machen. Kein Spam, nur Inhalte die zählen."
            source="homepage-footer"
          />
        </div>
      </div>
    </div>
  )
}
