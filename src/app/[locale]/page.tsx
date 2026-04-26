import { Recycle, Store, Wrench, BookOpen, Heart, Users, Award, Gift } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getCompactMetrics } from '@/data/impact-metrics'
import AsSeenInLogos from '@/components/about/AsSeenInLogos'
import Heading from '@/components/ui/Heading'
import { PageHero } from '@/components/layout/PageHero'
import { NewsletterSignup } from '@/components/community/NewsletterSignup'
import { CommunityStats } from '@/components/community/CommunityStats'
import { DESIGN_TOKENS } from '@/lib/design/tokens'
import { ORG, CONTACT, LOCATIONS, OPENING_HOURS } from '@/config/org'
import { safeJsonLd } from '@/lib/seo/json-ld'

const OG_LOCALE_MAP: Record<string, string> = {
  de: 'de_CH',
  fr: 'fr_CH',
  en: 'en_GB',
  it: 'it_CH',
  es: 'es_ES',
  ja: 'ja_JP',
  ko: 'ko_KR',
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })

  return {
    title: `${ORG.name} – ${t('meta.title')}`,
    description: t('meta.description'),
    keywords: ['Computer Reparatur Schweiz', 'Linux Installation', 'Datenrettung', 'Vintage Computer', 'Open Source', 'nachhaltige IT', 'Zürich', 'Basel', 'Luzern', 'refurbished Computer'],
    openGraph: {
      title: `${ORG.name} – ${t('hero.title')}`,
      description: t('meta.description'),
      type: 'website',
      locale: OG_LOCALE_MAP[locale] ?? 'de_CH',
      url: ORG.website,
      siteName: ORG.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${ORG.name} – ${t('hero.title')}`,
      description: t('meta.description'),
    },
  }
}

export default async function Home() {
  const t = await getTranslations('home')
  const compactMetrics = getCompactMetrics({
    devicesRescued: t('impact.compactMetrics.devicesRescued'),
    peopleTrained: t('impact.compactMetrics.peopleTrained'),
    reuseRate: t('impact.compactMetrics.reuseRate'),
    lifespanExtension: t('impact.compactMetrics.lifespanExtension'),
    internshipSuccess: t('impact.compactMetrics.internshipSuccess'),
    careerReentries: t('impact.compactMetrics.careerReentries'),
  })

  // Action cards — colors sourced from DESIGN_TOKENS (SSOT)
  const actionCards = [
    {
      icon: Store,
      theme: 'marketplace' as const,
      title: t('actions.sell.title'),
      subtitle: t('actions.sell.subtitle'),
      primaryLabel: t('actions.sell.primaryLabel'),
      primaryHref: '/marketplace',
      secondaryLabel: t('actions.sell.secondaryLabel'),
      secondaryHref: '/marketplace/sell',
    },
    {
      icon: Wrench,
      theme: 'itHilfe' as const,
      title: t('actions.repair.title'),
      subtitle: t('actions.repair.subtitle'),
      primaryLabel: t('actions.repair.primaryLabel'),
      primaryHref: '/it-hilfe',
      secondaryLabel: t('actions.repair.secondaryLabel'),
      secondaryHref: '/profil/techniker',
    },
    {
      icon: BookOpen,
      theme: 'workshops' as const,
      title: t('actions.learn.title'),
      subtitle: t('actions.learn.subtitle'),
      primaryLabel: t('actions.learn.primaryLabel'),
      primaryHref: '/workshops',
      secondaryLabel: t('actions.learn.secondaryLabel'),
      secondaryHref: '/knowhow',
    },
  ]

  // Community cards — all colors sourced from DESIGN_TOKENS (SSOT)
  const communityCards = [
    {
      icon: Users,
      badge: DESIGN_TOKENS.iconBadges.about,
      hoverColor: DESIGN_TOKENS.cards.hoverText.about,
      title: t('community.use.title'),
      desc: t('community.use.desc'),
      href: '/auth/register',
      border: DESIGN_TOKENS.cards.border.default,
    },
    {
      icon: Heart,
      badge: DESIGN_TOKENS.iconBadges.services,
      hoverColor: DESIGN_TOKENS.cards.hoverText.services,
      title: t('community.volunteer.title'),
      desc: t('community.volunteer.desc'),
      href: '/get-involved/volunteer',
      border: DESIGN_TOKENS.cards.border.default,
    },
    {
      icon: Gift,
      badge: DESIGN_TOKENS.iconBadges.marketplace,
      hoverColor: DESIGN_TOKENS.cards.hoverText.marketplace,
      title: t('community.donate.title'),
      desc: t('community.donate.desc'),
      href: '/get-involved/donate',
      border: DESIGN_TOKENS.cards.border.default,
    },
    {
      icon: Award,
      badge: DESIGN_TOKENS.iconBadges.getInvolved,
      hoverColor: DESIGN_TOKENS.cards.hoverText.getInvolved,
      title: t('community.membership.title'),
      desc: t('community.membership.desc'),
      href: '/mitglied-werden',
      border: DESIGN_TOKENS.cards.border.featured,
    },
  ]

  return (
    <div className="bg-white">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": ORG.name,
            "description": t('jsonld.description'),
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
            "areaServed": t('jsonld.areaServed').split(',').map((s: string) => s.trim()),
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
                    "name": t('jsonld.service1Name'),
                    "description": t('jsonld.service1Desc')
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": t('jsonld.service2Name'),
                    "description": t('jsonld.service2Desc')
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": t('jsonld.service3Name'),
                    "description": t('jsonld.service3Desc')
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
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-x-6">
          <Link
            href="/marketplace"
            className="w-full sm:w-auto rounded-md bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 text-center"
          >
            {t('hero.ctaDiscover')}
          </Link>
          <Link href="/about" className="text-base font-semibold leading-6 text-gray-900">
            {t('hero.ctaAbout')} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </PageHero>

      {/* Section 2: Three Action Cards */}
      <div id="actions" className="bg-gradient-to-b from-white to-gray-50 py-12 sm:py-16 lg:py-20" aria-label="Hauptaktionen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <Heading level={2} variant="site" className="tracking-tight text-gray-900">
              {t('actions.heading')}
            </Heading>
          </div>

          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            {actionCards.map((card) => {
              const badge = DESIGN_TOKENS.iconBadges[card.theme]
              const primaryBtn = DESIGN_TOKENS.buttons.primary[card.theme]
              const secondaryBtn = DESIGN_TOKENS.buttons.secondary[card.theme]
              const focusOutline = DESIGN_TOKENS.focusOutline[card.theme]
              return (
                <div key={card.title} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${badge.bg} mb-4`} aria-hidden="true">
                    <card.icon className={`h-6 w-6 ${badge.text}`} />
                  </div>
                  <Heading level={3} className="text-xl sm:text-2xl font-bold text-gray-900">{card.title}</Heading>
                  <p className="mt-2 text-base text-gray-600 flex-1">
                    {card.subtitle}
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Link
                      href={card.primaryHref}
                      className={`flex-1 rounded-md ${primaryBtn} px-4 py-3 text-base font-semibold text-white text-center shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${focusOutline}`}
                    >
                      {card.primaryLabel}
                    </Link>
                    <Link
                      href={card.secondaryHref}
                      className={`flex-1 rounded-md bg-white px-4 py-3 text-base font-semibold ${secondaryBtn} text-center border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${focusOutline}`}
                    >
                      {card.secondaryLabel}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Section 2b: Professional Services (brief mention) */}
      <div className="bg-white py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-base text-gray-600">
            {t.rich('proServices.text', {
              link: (chunks) => (
                <Link href="/services" className="font-semibold text-green-600 hover:text-green-700 underline underline-offset-2">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
      </div>

      {/* Section 3: Social Proof */}
      <div className="bg-gray-50 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Heading level={2} variant="site" className="tracking-tight text-gray-900">
              {t('impact.title')}
            </Heading>
            <p className="mt-2 text-base text-gray-600">{t('impact.subtitle')}</p>
          </div>
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
                className="text-sm font-semibold text-green-600 hover:text-green-700 underline underline-offset-2"
              >
                {t('impact.moreLink')} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: How to Get Involved */}
      <div className="bg-green-50 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <Heading level={2} variant="site" className="tracking-tight text-gray-900">
              {t('community.heading')}
            </Heading>
            <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              {t('community.subtitle')}
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {communityCards.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={`bg-white rounded-xl p-6 border ${item.border} hover:shadow-md transition-shadow group`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.badge.bg} mb-4`} aria-hidden="true">
                  <item.icon className={`h-5 w-5 ${item.badge.text}`} />
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
            source="homepage-footer"
          />
        </div>
      </div>
    </div>
  )
}
