// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Store, ShoppingCart, MapPin, Clock, ExternalLink, Map as MapIcon, Shield, Heart, HandHelping } from 'lucide-react'
import { SHOPWARE_URL, STORE_ADDRESS, STORE_GOOGLE_MAPS_URL, STORE_OSM_URL } from '@/lib/constants'
import { ORG, OPENING_HOURS } from '@/config/org'
import { PageHero } from '@/components/layout/PageHero'
import { MissionStrip } from '@/components/commerce/MissionStrip'
import { getTranslations } from 'next-intl/server'
import { ROUTES } from '@/config/routes'

interface ShopPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'shop' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('page.metaDescription', { orgName: ORG.name })
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'shop' })

  return (
    <main>
      <PageHero
        theme="services"
        icon={ShoppingCart}
        title={t('page.heroTitle')}
        subtitle={t('page.heroSubtitle')}
      />

      <MissionStrip />

      <section className="py-16 sm:py-20 bg-surface-base" id="routing">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="ui-public-eyebrow">{t('page.store.title').toUpperCase()}</div>
            <h2 className="ui-public-display-md mt-3">{t('page.online.title')} & {t('page.store.title')}</h2>
            <p className="ui-public-section-lede mt-4 mx-auto">{t('page.online.tagline')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <article className="ui-public-card" id="ladenlokal">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-action text-action-text flex items-center justify-center">
                  <Store className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="ui-public-card-title">{t('page.store.title')}</h3>
                  <p className="ui-public-meta">{t('page.store.tagline')}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 w-5 h-5 text-action shrink-0" aria-hidden="true" />
                  <div>
                    <p className="ui-public-prose-strong">{STORE_ADDRESS}</p>
                    <p className="ui-public-meta mt-1">{t('page.store.accessInfo')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 w-5 h-5 text-action shrink-0" aria-hidden="true" />
                  <div>
                    <p className="ui-public-prose-strong">{t('page.store.openingHours')}</p>
                    <p className="ui-public-meta mt-1">
                      {t('page.store.openingHoursMonday', { hours: OPENING_HOURS.monday })}
                      <br />
                      {t('page.store.openingHoursTueFri', { hours: OPENING_HOURS.tuesdayToFriday })}
                    </p>
                  </div>
                </div>
                <div className="ui-public-cta-row pt-2">
                  <a href={STORE_GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="ui-public-cta inline-flex items-center gap-2">
                    <MapPin className="w-4 h-4" aria-hidden="true" /> {t('page.store.openGoogleMaps')}
                  </a>
                  <a href={STORE_OSM_URL} target="_blank" rel="noopener noreferrer" className="ui-public-cta-ghost inline-flex items-center gap-2">
                    <MapIcon className="w-4 h-4" aria-hidden="true" /> {t('page.store.openOsm')}
                  </a>
                  <Link href="/contact" className="ui-public-cta-ghost">
                    {t('page.store.contact')}
                  </Link>
                </div>
                <div className="rounded-xl border border-subtle bg-surface-raised p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 w-4 h-4 text-action shrink-0" aria-hidden="true" />
                    <div>
                      <p className="ui-public-prose-strong mb-1">{t('page.store.mapsInfoTitle')}</p>
                      <p className="ui-public-prose-muted">{t('page.store.mapsInfoBody')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="ui-public-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-action text-action-text flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="ui-public-card-title">{t('page.online.title')}</h3>
                  <p className="ui-public-meta">{t('page.online.tagline')}</p>
                </div>
              </div>
              <ul className="ui-public-card-body space-y-2 list-disc list-inside">
                <li>{t('page.online.benefit1')}</li>
                <li>{t('page.online.benefit2')}</li>
                <li>{t('page.online.benefit3')}</li>
              </ul>
              <div className="ui-public-cta-row mt-6">
                <a href={SHOPWARE_URL} target="_blank" rel="noopener noreferrer" className="ui-public-cta-ghost inline-flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" aria-hidden="true" /> {t('page.online.shopwareShop')}
                </a>
                <Link href={ROUTES.public.marketplace} className="ui-public-cta inline-flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" aria-hidden="true" /> {t('page.online.onlineShop', { orgName: ORG.name })}
                </Link>
              </div>
              <div className="mt-4 rounded-xl border border-subtle bg-surface-raised p-4 text-sm">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 w-4 h-4 text-text-tertiary shrink-0" aria-hidden="true" />
                  <div>
                    <p className="ui-public-prose-strong mb-1">{t('page.online.multiShopTitle')}</p>
                    <p className="ui-public-prose-muted">{t('page.online.multiShopBody', { orgName: ORG.name })}</p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="ui-public-band py-16 sm:py-20 border-t border-subtle" aria-label={t('page.otherPaths.altTitle')}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="ui-public-eyebrow">{t('page.otherPaths.altTitle').toUpperCase()}</div>
            <h2 className="ui-public-display-md mt-3">{t('page.otherPaths.altTitle')}</h2>
            <p className="ui-public-section-lede mt-4 mx-auto">{t('page.otherPaths.altIntro')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/get-involved/donate" className="ui-public-start-card group">
              <Heart className="h-6 w-6 text-action mb-4" aria-hidden="true" />
              <h3 className="ui-public-start-card-title group-hover:text-action transition-colors">
                {t('page.otherPaths.donateTitle')}
              </h3>
              <p className="ui-public-start-card-body">{t('page.otherPaths.donateBody')}</p>
              <span className="ui-public-start-card-link">{t('page.otherPaths.donateCta')} →</span>
            </Link>

            <Link href="/projects/compirat" className="ui-public-start-card group">
              <HandHelping className="h-6 w-6 text-action mb-4" aria-hidden="true" />
              <h3 className="ui-public-start-card-title group-hover:text-action transition-colors">
                {t('page.otherPaths.needTitle')}
              </h3>
              <p className="ui-public-start-card-body">{t('page.otherPaths.needBody')}</p>
              <span className="ui-public-start-card-link">{t('page.otherPaths.needCta')} →</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
