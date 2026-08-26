import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/layout/Section'
import { Link } from '@/i18n/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ORG } from '@/config/org'
import { safeJsonLd } from '@/lib/seo/json-ld'
import { ROUTES } from '@/config/routes'
import { JOURNEY_ENTRYPOINTS } from '@/config/customer-journeys'
import { EVIG_DIVISIONS } from '@/config/divisions'
import { EVIG_PILLARS } from '@/config/pillars'

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
    // The layout already appends "| evig" via its title template, and
    // meta.title used to start with "evig —" as well, so the tab read
    // "evig – evig — … | evig". The org name belongs to the template; this
    // string is only the descriptive half.
    title: t('meta.title'),
    description: t('meta.description'),
    // Keywords are language-specific prose, so they belong in the message
    // files like every other sentence — they used to be a German array frozen
    // into this component, which meant seven locales were served German SEO
    // keywords. One comma-separated string per locale, split here: the same
    // shape `jsonld.areaServed` already uses, and it avoids the array-in-
    // messages fragility (the DE fallback replaces arrays wholesale).
    keywords: t('meta.keywords').split(',').map((s: string) => s.trim()),
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
  const tDivisions = await getTranslations('divisions')
  const tPillars = await getTranslations('pillars')

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

          <div className="ui-public-cta-row">
            <Link href={JOURNEY_ENTRYPOINTS.orgShop} className="ui-public-cta">
              {t('hero.ctaDonate')}
            </Link>
            <Link href={JOURNEY_ENTRYPOINTS.itHelpTechnicians} className="ui-public-cta-ghost">
              {t('hero.ctaDiscover')}
            </Link>
          </div>

          {/* Division rail — the brand architecture, stated in the first screen
              and rendered straight from EVIG_DIVISIONS. This replaced a hand-
              written sublede that listed surfaces ("Shop, Marktplatz, Werkstatt
              …") and drifted every time the org changed shape. */}
          <nav
            aria-label={tDivisions('overview.eyebrow')}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          >
            {EVIG_DIVISIONS.map((division) => (
              <Link
                key={division.id}
                href={division.href}
                className="ui-public-eyebrow hover:text-text-primary transition-colors"
              >
                {division.wordmark}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* Two sections stood here and both said what the pillars section below
          now says. The divisions grid restated the hero rail as cards — its
          `technicians` card headline was VERBATIM the pillars' "Jemanden
          finden, der es repariert", the same sentence twice on one page — and
          the "Drei Wege" grid was a third framing of the same choices, with
          "Techniker finden" appearing as a CTA in all three.

          Together they were 1612px of desktop and 2442px of phone spent
          repeating the answer. Divisions remain the brand SSOT and still
          render in the hero rail above, the footer column, the nav and the
          /ai page; they just do not need a card grid competing with the
          section that states what evig actually does. */}

      {/* ── The five pillars (SSOT: config/pillars.ts) ───────────────
          This replaced two bands that told the circular-IT story of the
          organisation evig came from: a "zweites Leben / weitergeben" ribbon
          and a "Drei Schritte. Ein Kreislauf." funnel that opened by asking
          the reader to donate their old kit. That story is still true, but it
          is the consequence, not the reason — and it answered a question
          nobody arriving here is asking. These five say what evig can do for
          the person reading, and each one links to where they do it. */}
      <Section density="spacious" tone="tinted" contained={false} className="border-y border-subtle">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Eyebrow as="div">{tPillars('eyebrow')}</Eyebrow>
            <h2 className="ui-public-display-lg mt-4">
              {/* Count is data, not copy — it follows EVIG_PILLARS. */}
              {tPillars('heading', { count: EVIG_PILLARS.length })}
            </h2>
            <p className="ui-public-section-lede mt-6">{tPillars('subtitle')}</p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EVIG_PILLARS.map((pillar) => {
              const Icon = pillar.icon
              return (
                <Link key={pillar.id} href={pillar.href} className="ui-public-card group">
                  <Icon className="h-6 w-6 text-action" aria-hidden />
                  <h3 className="ui-public-card-title mt-4">
                    {tPillars(`items.${pillar.id}.title` as never)}
                  </h3>
                  <p className="ui-public-card-body">
                    {tPillars(`items.${pillar.id}.body` as never)}
                  </p>
                  <span className="ui-public-card-meta inline-flex items-center gap-1 group-hover:text-text-primary transition-colors">
                    {tPillars(`items.${pillar.id}.cta` as never)} →
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </Section>


      {/* ── Community entry points ─────────────────────────────────── */}
      <Section density="spacious" contained={false}>
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
      </Section>

      {/* ── Final centered CTA band ─────────────────────────────────── */}
      <Section density="spacious" contained={false} className="border-t border-subtle text-center">
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
      </Section>
    </div>
  )
}
