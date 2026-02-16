import { ArrowRight, Recycle, Wrench, Store, ShoppingBag, DollarSign, Users } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCompactMetrics } from '@/data/impact-metrics'
import { VALUE_PROPS, TESTIMONIALS } from '@/data/homepage'
import AsSeenInLogos from '@/components/about/AsSeenInLogos'
import Heading from '@/components/ui/Heading'
import { PageHero } from '@/components/layout/PageHero'

export const metadata: Metadata = {
  title: 'revamp-it – Alte Hardware. Neues Leben. | Computer-Reparatur & Linux in der Schweiz',
  description: 'Wir geben alter Hardware ein zweites Leben. Computer reparieren, aufrüsten und mit Linux wiederherstellen. Nachhaltige IT-Lösungen für Privatpersonen, Vereine und KMU.',
  keywords: ['Computer Reparatur Schweiz', 'Linux Installation', 'Datenrettung', 'Vintage Computer', 'Open Source', 'nachhaltige IT', 'Zürich', 'Basel', 'Luzern', 'refurbished Computer'],
  openGraph: {
    title: 'revamp-it – Alte Hardware. Neues Leben.',
    description: 'Wir geben alter Hardware ein zweites Leben. Computer reparieren, aufrüsten und mit Linux wiederherstellen. Nachhaltige IT-Lösungen in der Schweiz.',
    type: 'website',
    locale: 'de_CH',
    url: 'https://revampit.vercel.app',
    siteName: 'revamp-it',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'revamp-it – Alte Hardware. Neues Leben.',
    description: 'Wir geben alter Hardware ein zweites Leben. Computer reparieren, aufrüsten und mit Linux wiederherstellen.',
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
            "name": "revamp-it",
            "description": "Computer-Reparatur, Linux-Installation und Datenrettung. Nachhaltige IT-Lösungen für Privatpersonen, Vereine und KMU.",
            "url": "https://revampit.vercel.app",
            "telephone": "+41-XX-XXX-XX-XX",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Zürich",
              "addressRegion": "ZH",
              "addressCountry": "CH"
            },
            "areaServed": ["Zürich", "Basel", "Luzern", "Schweiz"],
            "priceRange": "$$",
            "openingHours": "Mo-Fr 09:00-18:00",
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
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Webentwicklung",
                    "description": "Moderne Websites mit Open-Source-Technologien"
                  }
                }
              ]
            }
          })
        }}
      />

      {/* Hero section */}
      <PageHero
        theme="home"
        icon={Recycle}
        title="Alte Hardware. Neues Leben."
        subtitle="Alte Computer reparieren, aufrüsten und wiederherstellen. Gebrauchte Hardware bekommt mit Linux und Open Source ein zweites Leben. Für eine nachhaltigere Zukunft und mehr Technologie für alle."
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-x-6">
          <Link
            href="/shop"
            className="w-full sm:w-auto rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 text-center"
          >
            Zum Shop
          </Link>
          <Link href="/services" className="text-sm font-semibold leading-6 text-gray-900">
            Unsere Dienstleistungen <span aria-hidden="true">→</span>
          </Link>
        </div>
      </PageHero>

      {/* As Seen In - Media Logos */}
      <AsSeenInLogos />

      {/* Community Platforms Section - Marketplace + IT-Hilfe */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white mb-4">
              <Users className="h-3 w-3" />
              Neu: Community-Plattformen
            </div>
            <Heading level={2} className="tracking-tight text-gray-900">
              Community: Gemeinsam stärker
            </Heading>
            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-600">
              Unsere neuen Peer-to-Peer-Plattformen verbinden die Community: Kaufe und verkaufe gebrauchte IT-Geräte oder finde freiwillige Techniker in deiner Nähe.
            </p>
          </div>

          <div className="mt-10 sm:mt-12 lg:mt-16 grid gap-6 sm:gap-8 lg:grid-cols-2">
            {/* Marketplace Card */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 sm:p-8 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                    <Store className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Marketplace</h3>
                  <p className="mt-2 text-base text-gray-600">
                    Community-Marktplatz für gebrauchte IT. Kaufe und verkaufe Computer, Laptops und Zubehör direkt mit anderen – fair, nachhaltig und lokal.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <ShoppingBag className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Kaufen</div>
                    <div className="text-xs text-gray-500">Faire Preise, grosse Auswahl</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Verkaufen</div>
                    <div className="text-xs text-gray-500">Alte Hardware weitergeben</div>
                  </div>
                </div>
              </div>

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
                  Inserat erstellen
                </Link>
              </div>
            </div>

            {/* IT-Hilfe Card */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 sm:p-8 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                    <Wrench className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">IT-Hilfe</h3>
                  <p className="mt-2 text-base text-gray-600">
                    Community-basierter IT-Support. Finde freiwillige Techniker in deiner Nähe oder teile dein Wissen und hilf anderen.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Hilfe finden</div>
                    <div className="text-xs text-gray-500">Techniker in der Nähe</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Wrench className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Helfen</div>
                    <div className="text-xs text-gray-500">Wissen teilen</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/it-hilfe"
                  className="flex-1 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white text-center shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  Hilfe suchen
                </Link>
                <Link
                  href="/profil/skills"
                  className="flex-1 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-emerald-600 text-center border border-emerald-600 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  Techniker werden
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Value Propositions */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-sm sm:text-base font-semibold leading-7 text-green-600">Was wir tun</h2>
          <p className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            Expertise in Vintage Hardware, Linux und Open Source
          </p>
        </div>
        <div className="mx-auto mt-8 sm:mt-12 md:mt-16 max-w-2xl lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-6 sm:gap-x-8 gap-y-8 sm:gap-y-12 lg:max-w-none lg:grid-cols-4">
            {VALUE_PROPS.map((prop) => (
              <Link
                key={prop.name}
                href={prop.href}
                className="flex flex-col group hover:bg-gray-50 p-4 sm:p-6 rounded-lg transition-colors"
              >
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 group-hover:text-green-600 transition-colors">
                  <prop.icon className="h-5 w-5 flex-none text-green-600" aria-hidden="true" />
                  {prop.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{prop.description}</p>
                  <span className="mt-4 text-sm font-semibold text-green-600 group-hover:text-green-700">
                    Mehr erfahren →
                  </span>
                </dd>
              </Link>
            ))}
          </dl>
        </div>
      </div>

      {/* CTA Section - Termin vereinbaren */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-green-50 rounded-2xl px-4 sm:px-6 py-12 sm:py-16 md:px-16 text-center">
          <Heading level={2} className="tracking-tight text-gray-900">
            Bereit für eine nachhaltige IT-Lösung?
          </Heading>
          <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-600">
            Vereinbare einen kostenlosen Beratungstermin. Wir analysieren deine Bedürfnisse und finden gemeinsam die beste Lösung.
          </p>
          <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-x-6">
            <Link
              href="/contact"
              className="rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              Termin vereinbaren
            </Link>
            <Link href="/services" className="text-sm font-semibold leading-6 text-gray-900">
              Alle Dienstleistungen <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Impact Metrics Section - Compact */}
      <div className="bg-green-50 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-6 sm:mb-8">
            <h2 className="text-sm sm:text-base font-semibold leading-7 text-green-600">Unsere Wirkung</h2>
            <p className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Zahlen & Fakten
            </p>
          </div>

          {/* Compact metrics grid */}
          <dl className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3 mb-6 sm:mb-8">
            {compactMetrics.map((metric, index) => (
              <div key={index} className="text-center">
                <dd className="text-2xl sm:text-3xl font-bold text-green-600">{metric.value}</dd>
                <dt className="mt-1 text-xs sm:text-sm text-gray-600">{metric.label}</dt>
              </div>
            ))}
          </dl>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/about/impact"
              className="rounded-md bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              Mehr über unsere Wirkung
            </Link>
            <Link
              href="/get-involved"
              className="text-sm font-semibold text-green-600 hover:text-green-700"
            >
              Jetzt mitmachen <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-2xl lg:text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-sm sm:text-base font-semibold leading-7 text-green-600">Was unsere Kunden sagen</h2>
          <p className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            Echte Erfolgsgeschichten
          </p>
        </div>
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:gap-8 lg:max-w-none lg:grid-cols-2">
          {TESTIMONIALS.map((testimonial, index) => (
            <div key={index} className="flex flex-col bg-gray-50 rounded-lg p-6 sm:p-8 border border-gray-200">
              <div className="text-green-600 mb-4">
                <span className="text-3xl font-bold">&#34;</span>
              </div>
              <blockquote className="text-gray-600 mb-6 italic text-base leading-7">
                {testimonial.quote}
              </blockquote>
              <div className="mt-auto">
                <div className="font-semibold text-gray-900">{testimonial.author}</div>
                <div className="text-sm text-gray-500">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mitmachen CTA section */}
      <div className="relative isolate px-4 sm:px-6 py-16 sm:py-24 md:py-32 lg:py-40 lg:px-8 bg-green-50">
        <div className="mx-auto max-w-2xl text-center">
          <Heading level={2} className="tracking-tight text-gray-900">
            Bereit, einen Unterschied zu machen?
          </Heading>
          <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-600">
            Werde Teil unserer Freiwilligen-Community und hilf mit, eine nachhaltigere Zukunft durch Technik zu gestalten.
          </p>
          <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-x-6">
            <Link
              href="/get-involved"
              className="rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              Mitmachen
            </Link>
            <Link href="/about" className="text-sm font-semibold leading-6 text-gray-900">
              Mehr erfahren <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
