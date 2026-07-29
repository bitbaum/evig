import { Eyebrow } from '@/components/ui/Eyebrow'
import { Link } from '@/i18n/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ORG } from '@/config/org'
import { safeJsonLd } from '@/lib/seo/json-ld'
import { ROUTES } from '@/config/routes'
import { JOURNEY_ENTRYPOINTS } from '@/config/customer-journeys'

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
  const actionCards = [
    {
      label: t('actions.sell.label'),
      title: t('actions.sell.title'),
      body: t('actions.sell.subtitle'),
      ctaLabel: t('actions.sell.primaryLabel'),
      ctaHref: JOURNEY_ENTRYPOINTS.orgShop,
    },
    {
      label: t('actions.repair.label'),
      title: t('actions.repair.title'),
      body: t('actions.repair.subtitle'),
      ctaLabel: t('actions.repair.primaryLabel'),
      ctaHref: JOURNEY_ENTRYPOINTS.itHelpRequest,
    },
    {
      label: t('actions.learn.label'),
      title: t('actions.learn.title'),
      body: t('actions.learn.subtitle'),
      ctaLabel: t('actions.learn.primaryLabel'),
      ctaHref: '/workshops',
    },
  ]

  const processSteps = [
    { num: '01', title: t('process.step1.title'), body: t('process.step1.body') },
    { num: '02', title: t('process.step2.title'), body: t('process.step2.body') },
    { num: '03', title: t('process.step3.title'), body: t('process.step3.body') },
  ]

  const communityCards = [
    { title: t('community.use.title'),        body: t('community.use.desc'),        href: ROUTES.public.shop,           ctaLabel: t('community.use.cta') },
    { title: t('community.volunteer.title'),  body: t('community.volunteer.desc'),  href: '/get-involved/volunteer',    ctaLabel: t('community.volunteer.cta') },
    { title: t('community.donate.title'),     body: t('community.donate.desc'),     href: ROUTES.public.donate,         ctaLabel: t('community.donate.cta') },
    { title: t('community.membership.title'), body: t('community.membership.desc'), href: ROUTES.public.mitgliedWerden, ctaLabel: t('community.membership.cta') },
  ]

  return (
    <div className="bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": ORG.name,
            "description": t('jsonld.description'),
            "url": ORG.website,
            "areaServed": t('jsonld.areaServed').split(',').map((s: string) => s.trim()),
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "IT Services",
              "itemListElement": [
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": t('jsonld.service1Name'), "description": t('jsonld.service1Desc') } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": t('jsonld.service2Name'), "description": t('jsonld.service2Desc') } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": t('jsonld.service3Name'), "description": t('jsonld.service3Desc') } }
              ]
            }
          })
        }}
      />

      {/* ── Hero — brand promise first, no numbers ─────────────────── */}
      <section className="ui-public-hero-fold">
        <div className="max-w-5xl">
          <div className="ui-public-hero-badge">{t('hero.positioning')}</div>

          <h1 className="ui-public-hero-title">
            {t('hero.titlePrimary')}<br />
            <span className="ui-public-hero-title-fade text-text-tertiary">{t('hero.titleSecondary')}</span>
          </h1>

          <p className="ui-public-hero-lede">{t('hero.lede')}</p>
          <p className="ui-public-hero-sublede">{t('hero.sublede')}</p>

          <div className="ui-public-cta-row">
            <Link href={JOURNEY_ENTRYPOINTS.orgShop} className="ui-public-cta">
              {t('hero.ctaDonate')}
            </Link>
            <Link href={JOURNEY_ENTRYPOINTS.itHelpTechnicians} className="ui-public-cta-ghost">
              {t('hero.ctaDiscover')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Three primary actions ──────────────────────────────────── */}
      <section className="ui-public-band py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-end">
            <div>
              <Eyebrow as="div">{t('actions.eyebrow')}</Eyebrow>
              <h2 className="ui-public-display-lg mt-4">{t('actions.heading')}</h2>
            </div>
            <p className="ui-public-section-lede md:justify-self-end">
              {t('actions.subtitle')}
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {actionCards.map((card) => (
              <article key={card.title} className="ui-public-card">
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

      {/* ── Two-column principle ribbon — pure typography, no chrome ── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-x-16 gap-y-20 md:grid-cols-2">
            <div>
              <Eyebrow as="div">{t('ribbon.left.eyebrow')}</Eyebrow>
              <h3 className="ui-public-display-md mt-3">{t('ribbon.left.title')}</h3>
              <p className="ui-public-section-lede mt-6">{t('ribbon.left.body')}</p>
            </div>
            <div>
              <Eyebrow as="div">{t('ribbon.right.eyebrow')}</Eyebrow>
              <h3 className="ui-public-display-md mt-3">{t('ribbon.right.title')}</h3>
              <p className="ui-public-section-lede mt-6">{t('ribbon.right.body')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 01 / 02 / 03 — the cycle ────────────────────────────────── */}
      <section className="ui-public-band py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Eyebrow as="div">{t('process.eyebrow')}</Eyebrow>
          <h2 className="ui-public-display-lg mt-4">{t('process.heading')}</h2>

          <div className="ui-public-body-lg mx-auto mt-16 max-w-3xl space-y-16 text-left">
            {processSteps.map((step) => (
              <div key={step.num} className="flex gap-8">
                <div className="ui-public-step-num">{step.num}</div>
                <div>
                  <div className="ui-public-prose-strong">{step.title}</div>
                  <div className="ui-public-prose-muted mt-2">{step.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Community entry points ─────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <Eyebrow as="div">{t('community.eyebrow')}</Eyebrow>
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
          <Eyebrow as="div">{t('finalCta.eyebrow')}</Eyebrow>
          <h2 className="ui-public-display-lg mt-4">{t('finalCta.heading')}</h2>
          <p className="ui-public-section-lede mt-6 mx-auto">{t('finalCta.subtitle')}</p>
          <div className="mt-10">
            <Link href={JOURNEY_ENTRYPOINTS.orgShop} className="ui-public-cta-lg">
              {t('finalCta.button')}
            </Link>
          </div>
          <p className="ui-public-meta mt-6">{t('finalCta.note')}</p>
        </div>
      </section>
    </div>
  )
}
