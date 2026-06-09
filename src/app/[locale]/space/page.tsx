// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Building2, ChevronRight, ExternalLink } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { STORE_ADDRESS, STORE_GOOGLE_MAPS_URL, STORE_OSM_URL } from '@/lib/constants'
import { ORG, LOCATIONS, OPENING_HOURS, LOCATION_HISTORY, formatLocationPeriod } from '@/config/org'
import { getTranslations } from 'next-intl/server'
import { ROUTES } from '@/config/routes'

interface SpacePageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: SpacePageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'space' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function SpacePage({ params }: SpacePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'space' })
  const tEye = await getTranslations({ locale, namespace: 'common.eyebrows' })

  const historyLocations = t.raw('history.locations') as Array<{ highlight: string; description: string }>
  const spaceFeatures = t.raw('future.features') as Array<{ name: string; description: string }>
  const kpis = t.raw('impact.kpis') as Array<{ metric: string; reason: string; current: string; potential: string }>

  return (
    <main>
      <PageHero
        theme="about"
        icon={Building2}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      >
        <div className="ui-public-cta-row mt-8">
          <Link href="#zukunft" className="ui-public-cta">{t('hero.visionBtn')}</Link>
          <Link href="/get-involved/donate" className="ui-public-cta-ghost">{t('hero.donateBtn')}</Link>
        </div>
      </PageHero>

      {/* ── Timeline — text-only, monochrome ──────────────────────── */}
      <section className="ui-public-band py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="ui-public-eyebrow">{tEye('timeline')}</div>
            <Heading level={2} className="ui-public-display-lg mt-4">{t('history.title')}</Heading>
            <p className="ui-public-section-lede mt-6 mx-auto">{t('history.subtitle')}</p>
          </div>

          <ol className="ui-public-body-lg space-y-12 text-left">
            {LOCATION_HISTORY.map((entry, index) => {
              const location = historyLocations[index]
              const isCurrent = entry.period.to === null
              return (
                <li key={index} className="flex gap-8">
                  <div className="font-mono text-sm tabular-nums text-text-tertiary w-24 shrink-0 pt-1">
                    {formatLocationPeriod(entry.period)}
                  </div>
                  <div className="grow">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <div className="ui-public-prose-strong">{entry.name}</div>
                      <span className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                        {isCurrent ? '· AKTUELL · ' : '· '}{location?.highlight}
                      </span>
                    </div>
                    <p className="ui-public-prose-muted mt-2">
                      {location?.description.replace('{warehouseStreet}', LOCATIONS.warehouse.street)}
                    </p>
                    {isCurrent && (
                      <div className="mt-4 border-t border-subtle pt-4">
                        <p className="text-sm font-semibold text-text-primary">{STORE_ADDRESS}</p>
                        <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mt-2 flex flex-wrap gap-x-3 gap-y-1">
                          <a href={STORE_GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-text-primary transition-colors">
                            Google Maps <ExternalLink className="w-3 h-3" />
                          </a>
                          <span>·</span>
                          <a href={STORE_OSM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-text-primary transition-colors">
                            OpenStreetMap <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* ── Current Location Quick Info ───────────────────────────── */}
      <section className="border-y border-subtle py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div>
              <div className="ui-public-eyebrow">{t('currentLocation.label').toUpperCase()}</div>
              <p className="text-text-primary font-semibold mt-2">{STORE_ADDRESS}</p>
            </div>
            <div>
              <div className="ui-public-eyebrow">{t('currentLocation.hoursLabel').toUpperCase()}</div>
              <p className="text-text-secondary mt-2 font-mono tabular-nums text-sm">
                {t('currentLocation.hoursText', { monday: OPENING_HOURS.monday, tueFri: OPENING_HOURS.tuesdayToFriday })}
              </p>
            </div>
            <div className="md:justify-self-end">
              <Button as={Link} href="/shop#ladenlokal" variant="outline">
                {t('currentLocation.moreBtn')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Future Space Vision ───────────────────────────────────── */}
      <section id="zukunft" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="ui-public-eyebrow">{t('future.moveDeadline').toUpperCase()}</div>
            <Heading level={2} className="ui-public-display-lg mt-4">{t('future.title')}</Heading>
            <p className="ui-public-section-lede mt-6 mx-auto">{t('future.subtitle')}</p>
          </div>

          {/* Vision Statement */}
          <div className="mx-auto max-w-3xl card-shell p-10 text-center">
            <div className="ui-public-eyebrow">{tEye('vision')}</div>
            <p className="ui-public-display-md mt-3">
              {t('future.visionTagline', { orgName: ORG.name })}
            </p>
            <p className="ui-public-section-lede mt-6 mx-auto">{t('future.visionDesc')}</p>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mt-6">
              {t('future.visionCaption')}
            </p>
          </div>

          {/* Space Features — text-only cards */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {spaceFeatures.map((feature, index) => (
              <article key={index} className="ui-public-card">
                <div className="ui-public-card-label font-mono tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="ui-public-card-title">{feature.name}</h3>
                <p className="ui-public-card-body">{feature.description}</p>
              </article>
            ))}
          </div>

          {/* Parameters */}
          <div className="mt-12 mx-auto max-w-3xl card-shell p-8">
            <div className="ui-public-eyebrow">{t('future.params.title').toUpperCase()}</div>
            <Heading level={3} className="ui-public-display-md mt-3">{t('future.params.title')}</Heading>
            <p className="ui-public-section-lede mt-4">{t('future.params.subtitle')}</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 border-t border-subtle pt-8">
              {[
                { value: t('future.params.areaValue'),     label: t('future.params.areaLabel') },
                { value: t('future.params.budgetValue'),   label: t('future.params.budgetLabel') },
                { value: t('future.params.locationValue'), label: t('future.params.locationLabel') },
              ].map((param) => (
                <div key={param.label} className="text-center">
                  <div className="text-2xl font-semibold text-text-primary tabular-nums tracking-tight">{param.value}</div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mt-2">{param.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-subtle pt-6">
              <p className="text-sm text-text-secondary">{t('future.params.ideal')}</p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-text-secondary mb-4">{t('future.params.knowSpace')}</p>
              <Button as={Link} href="/contact" variant="primary">{t('future.params.contactBtn')}</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── KPI Impact ────────────────────────────────────────────── */}
      <section className="ui-public-band py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="ui-public-eyebrow">{tEye('potential')}</div>
            <Heading level={2} className="ui-public-display-lg mt-4">{t('impact.title')}</Heading>
            <p className="ui-public-section-lede mt-6 mx-auto">{t('impact.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kpis.map((item, index) => (
              <article key={index} className="ui-public-card">
                <div className="ui-public-card-label">{item.metric}</div>
                <div className="mt-4 flex items-end gap-6 font-mono tabular-nums">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">{t('impact.todayLabel')}</p>
                    <p className="text-2xl font-semibold text-text-tertiary mt-1">{item.current}</p>
                  </div>
                  <span className="text-text-tertiary mb-2">→</span>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-action">{t('impact.potentialLabel')}</p>
                    <p className="text-2xl font-semibold text-action mt-1">{item.potential}</p>
                  </div>
                </div>
                <p className="ui-public-card-body mt-3">{item.reason}</p>
              </article>
            ))}
          </div>

          {/* Donation CTA */}
          <div className="mt-16 border-t border-subtle pt-16 text-center">
            <div className="ui-public-eyebrow">{tEye('donate')}</div>
            <Heading level={3} className="ui-public-display-md mt-3">{t('impact.donateCard.title')}</Heading>
            <p className="ui-public-section-lede mt-4 mx-auto">{t('impact.donateCard.body')}</p>
            <div className="ui-public-cta-row mt-8">
              <Link href="/get-involved/donate" className="ui-public-cta">{t('impact.donateCard.donateBtn')}</Link>
              <Link href="/about/impact" className="ui-public-cta-ghost">{t('impact.donateCard.impactBtn')}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Shop links ────────────────────────────────────────────── */}
      <section className="border-t border-subtle py-12 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="ui-public-eyebrow">{t('shopLinks.title').toUpperCase()}</div>
          <p className="ui-public-section-lede mt-4 mx-auto mb-8">{t('shopLinks.subtitle')}</p>
          <div className="ui-public-cta-row">
            <Link href="/shop#ladenlokal" className="ui-public-cta-ghost">{t('shopLinks.currentStore')}</Link>
            <Link href={ROUTES.public.shop} className="ui-public-cta-ghost">{t('shopLinks.shopOverview')}</Link>
            <Link href={ROUTES.public.marketplace} className="ui-public-cta">{t('shopLinks.onlineShop')}</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
