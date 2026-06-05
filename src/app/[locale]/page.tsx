// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Link } from '@/i18n/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getCompactMetrics } from '@/data/impact-metrics'
import AsSeenInLogos from '@/components/about/AsSeenInLogos'
import { ORG, CONTACT, LOCATIONS, OPENING_HOURS } from '@/config/org'
import { safeJsonLd } from '@/lib/seo/json-ld'
import { ROUTES } from '@/config/routes'
import { auth } from '@/auth'

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

/**
 * Public homepage — RevampIT.
 *
 * Design discipline (fleetcrown / x.ai pattern):
 *   - One eyebrow + one display heading + one lede per section
 *   - Text-only surface cards (no icons-in-colored-circles template)
 *   - Alternating bands (ui-public-band tinted vs bare canvas)
 *   - Monospace eyebrows + meta lines for "system" feel
 *   - Single accent color (RevampIT green) reserved for primary CTAs only
 *   - All numbers tabular-nums and sourced from org-numbers SSOT
 *     (no hardcoded stats per CLAUDE.md)
 */
export default async function Home() {
  const t = await getTranslations('home')
  await auth()
  const compactMetrics = getCompactMetrics({
    devicesRescued: t('impact.compactMetrics.devicesRescued'),
    peopleTrained: t('impact.compactMetrics.peopleTrained'),
    reuseRate: t('impact.compactMetrics.reuseRate'),
    lifespanExtension: t('impact.compactMetrics.lifespanExtension'),
    internshipSuccess: t('impact.compactMetrics.internshipSuccess'),
    careerReentries: t('impact.compactMetrics.careerReentries'),
  })

  // Hero stat — pull the most credible single number from the SSOT.
  // First entry is devices rescued/year (org-numbers config); display
  // it huge in the hero so visitors see scale before reading copy.
  const heroStat = compactMetrics[0]

  // Three top actions — text-only cards. Each carries an eyebrow label
  // identifying the surface, a title with the user-question framing, a
  // body explaining what happens, and a single text link below (no
  // double-CTA-button clutter).
  const actionCards = [
    {
      label: t('actions.sell.label'),
      title: t('actions.sell.title'),
      body: t('actions.sell.subtitle'),
      ctaLabel: t('actions.sell.primaryLabel'),
      ctaHref: ROUTES.public.marketplace,
    },
    {
      label: t('actions.repair.label'),
      title: t('actions.repair.title'),
      body: t('actions.repair.subtitle'),
      ctaLabel: t('actions.repair.primaryLabel'),
      ctaHref: ROUTES.public.itHilfe,
    },
    {
      label: t('actions.learn.label'),
      title: t('actions.learn.title'),
      body: t('actions.learn.subtitle'),
      ctaLabel: t('actions.learn.primaryLabel'),
      ctaHref: '/workshops',
    },
  ]

  // Community entry points — text-only start cards. For the visitor
  // who's thinking "how can I be part of this?".
  const communityCards = [
    {
      title: t('community.donate.title'),
      body: t('community.donate.desc'),
      href: ROUTES.public.donate,
      ctaLabel: t('community.donate.cta'),
    },
    {
      title: t('community.volunteer.title'),
      body: t('community.volunteer.desc'),
      href: '/get-involved/volunteer',
      ctaLabel: t('community.volunteer.cta'),
    },
    {
      title: t('community.use.title'),
      body: t('community.use.desc'),
      href: ROUTES.public.shop,
      ctaLabel: t('community.use.cta'),
    },
    {
      title: t('community.membership.title'),
      body: t('community.membership.desc'),
      href: ROUTES.public.mitgliedWerden,
      ctaLabel: t('community.membership.cta'),
    },
  ]

  return (
    <div className="bg-canvas">
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

      {/* ── Hero ─────────────────────────────────────────────────────────
          Stat-first hero: the most credible single number sits above
          the brand line. 88vh fills the viewport so CTAs land above the
          fold on every screen. ───────────────────────────────────────── */}
      <section className="ui-public-hero-fold">
        <div className="max-w-5xl">
          <div className="ui-public-hero-badge">
            {t('hero.positioning')}
          </div>

          <div className="ui-public-stat-display mt-4">{heroStat.value}</div>
          <p className="ui-public-stat-caption mx-auto">{heroStat.label}</p>

          <h1 className="ui-public-hero-title mt-12">
            {t('hero.title')}
          </h1>

          <p className="ui-public-hero-lede">
            {t('hero.subtitle')}
          </p>

          <div className="ui-public-cta-row">
            <Link href={ROUTES.public.donate} className="ui-public-cta">
              {t('hero.ctaDonate')}
            </Link>
            <Link href={ROUTES.public.marketplace} className="ui-public-cta-ghost">
              {t('hero.ctaDiscover')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Three primary actions ──────────────────────────────────────
          Text-only cards. Same shape across all three (label / title /
          body / single CTA link) — discipline > variety. ─────────────── */}
      <section className="ui-public-band py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-end">
            <div>
              <div className="ui-public-eyebrow">{t('actions.eyebrow')}</div>
              <h2 className="ui-public-display-lg mt-4">{t('actions.heading')}</h2>
            </div>
            <p className="ui-public-section-lede md:justify-self-end">
              {t('actions.subtitle')}
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {actionCards.map((card) => (
              <article key={card.title} className="ui-public-card min-h-[280px]">
                <div className="ui-public-card-label">{card.label}</div>
                <h3 className="ui-public-card-title">{card.title}</h3>
                <p className="ui-public-card-body">{card.body}</p>
                <Link
                  href={card.ctaHref}
                  className="ui-public-card-meta inline-flex items-center gap-1 hover:text-text-primary transition-colors"
                >
                  {card.ctaLabel} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Impact — single tight strip, no card wrapping ─────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-end">
            <div>
              <div className="ui-public-eyebrow">{t('impact.eyebrow')}</div>
              <h2 className="ui-public-display-lg mt-4">{t('impact.title')}</h2>
            </div>
            <p className="ui-public-section-lede md:justify-self-end">
              {t('impact.subtitle')}
            </p>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6 border-t border-subtle pt-10">
            {compactMetrics.map((metric) => (
              <div key={metric.label}>
                <dd className="text-3xl sm:text-4xl font-semibold text-text-primary tabular-nums tracking-tight">
                  {metric.value}
                </dd>
                <dt className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                  {metric.label}
                </dt>
              </div>
            ))}
          </dl>

          <div className="mt-10">
            <Link href="/about/impact" className="ui-public-meta hover:text-text-primary transition-colors">
              {t('impact.moreLink')} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Press strip — desaturated, low-chrome ──────────────────── */}
      <section className="ui-public-band py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="ui-public-eyebrow text-center">{t('press.eyebrow')}</div>
          <div className="mt-8">
            <AsSeenInLogos />
          </div>
        </div>
      </section>

      {/* ── Community entry points ─────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="ui-public-eyebrow">{t('community.eyebrow')}</div>
            <h2 className="ui-public-display-lg mt-4">{t('community.heading')}</h2>
            <p className="ui-public-section-lede mt-6 mx-auto">{t('community.subtitle')}</p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {communityCards.map((card) => (
              <article key={card.title} className="ui-public-start-card">
                <h3 className="ui-public-start-card-title">{card.title}</h3>
                <p className="ui-public-start-card-body">{card.body}</p>
                <Link href={card.href} className="ui-public-start-card-link">
                  {card.ctaLabel} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final centered CTA band ─────────────────────────────────── */}
      <section className="border-t border-subtle py-20 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="ui-public-eyebrow">{t('finalCta.eyebrow')}</div>
          <h2 className="ui-public-display-lg mt-4">{t('finalCta.heading')}</h2>
          <p className="ui-public-section-lede mt-6 mx-auto">{t('finalCta.subtitle')}</p>
          <div className="mt-10">
            <Link href={ROUTES.public.donate} className="ui-public-cta-lg">
              {t('finalCta.button')}
            </Link>
          </div>
          <p className="ui-public-meta mt-6">{t('finalCta.note')}</p>
        </div>
      </section>
    </div>
  )
}
