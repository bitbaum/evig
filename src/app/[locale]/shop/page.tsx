// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-class'
import { Store, ShoppingCart, MapPin, Clock, ExternalLink, Map as MapIcon, Shield, Heart, HandHelping } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
      {/* Hero */}
      <PageHero
        theme="services"
        icon={ShoppingCart}
        title={t('page.heroTitle')}
        subtitle={t('page.heroSubtitle')}
      />

      {/* Mission anchor — frames the shop as the nonprofit it is, not a
          generic second-hand vendor. Live impact + methodology link. */}
      <MissionStrip />

      {/* Routing Options */}
      <section className="py-12 sm:py-16 md:py-20 bg-surface-base" id="routing">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Physical Store */}
            <Card className="overflow-hidden border">
              <CardHeader className="bg-action-muted-muted">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-action text-white flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle id="ladenlokal">{t('page.store.title')}</CardTitle>
                    <p className="text-sm text-text-secondary">{t('page.store.tagline')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 w-5 h-5 text-action" />
                  <div>
                    <p className="font-medium text-text-primary">{STORE_ADDRESS}</p>
                    <p className="text-sm text-text-secondary">
                      {t('page.store.accessInfo')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 w-5 h-5 text-action" />
                  <div>
                    <p className="font-medium text-text-primary">{t('page.store.openingHours')}</p>
                    <p className="text-sm text-text-secondary">
                      {t('page.store.openingHoursMonday', { hours: OPENING_HOURS.monday })}
                      <br />
                      {t('page.store.openingHoursTueFri', { hours: OPENING_HOURS.tuesdayToFriday })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a href={STORE_GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    <MapPin className="w-4 h-4 mr-2" /> {t('page.store.openGoogleMaps')}
                  </a>
                  <a href={STORE_OSM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    <MapIcon className="w-4 h-4 mr-2" /> {t('page.store.openOsm')}
                  </a>
                  <Link href="/contact" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    {t('page.store.contact')}
                  </Link>
                </div>
                <div className="mt-4 rounded-lg border bg-surface-raised p-4 text-sm text-text-secondary">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 w-4 h-4 text-action" />
                    <div>
                      <p className="font-medium text-text-primary mb-1">{t('page.store.mapsInfoTitle')}</p>
                      <p>{t('page.store.mapsInfoBody')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Online Shops */}
            <Card className="overflow-hidden border">
              <CardHeader className="bg-surface-raised">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-action text-white flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>{t('page.online.title')}</CardTitle>
                    <p className="text-sm text-text-secondary">
                      {t('page.online.tagline')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc list-inside text-text-secondary space-y-1">
                  <li>{t('page.online.benefit1')}</li>
                  <li>{t('page.online.benefit2')}</li>
                  <li>{t('page.online.benefit3')}</li>
                </ul>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button as="a" href={SHOPWARE_URL} target="_blank" rel="noopener noreferrer" variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" /> {t('page.online.shopwareShop')}
                  </Button>
                  <Link href={ROUTES.public.marketplace} className={buttonClass({ variant: 'primary' })}>
                    <ShoppingCart className="w-4 h-4 mr-2" /> {t('page.online.onlineShop', { orgName: ORG.name })}
                  </Link>
                </div>
                <div className="mt-4 rounded-lg border bg-surface-raised p-4 text-sm text-text-secondary">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 w-4 h-4 text-text-secondary dark:text-text-muted" />
                    <div>
                      <p className="font-medium text-text-primary mb-1">{t('page.online.multiShopTitle')}</p>
                      <p>{t('page.online.multiShopBody', { orgName: ORG.name })}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission paths beyond "buy" — donor + affordability entry points.
          Kept visually secondary to the two shop cards above so people who
          DID come to buy aren't distracted; people who came to give or who
          can't afford the shop find their path on the same page. */}
      <section className="py-12 sm:py-16 bg-surface-raised border-t border" aria-label={t('page.otherPaths.altTitle')}>
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary mb-2">
              {t('page.otherPaths.altTitle')}
            </h2>
            <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto">
              {t('page.otherPaths.altIntro')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Link
              href="/get-involved/donate"
              className="group flex gap-3 sm:gap-4 p-5 rounded-xl border bg-surface-base hover:border-strong transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-action-muted/15">
                <Heart className="h-5 w-5 text-action" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-text-primary mb-1 group-hover:text-action dark:group-hover:text-action transition-colors">
                  {t('page.otherPaths.donateTitle')}
                </h3>
                <p className="text-sm text-text-secondary mb-2">
                  {t('page.otherPaths.donateBody')}
                </p>
                <span className="text-sm font-medium text-action">
                  {t('page.otherPaths.donateCta')} →
                </span>
              </div>
            </Link>

            <Link
              href="/projects/compirat"
              className="group flex gap-3 sm:gap-4 p-5 rounded-xl border bg-surface-base hover:border-strong transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-action-muted/15">
                <HandHelping className="h-5 w-5 text-action" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-text-primary mb-1 group-hover:text-action dark:group-hover:text-action transition-colors">
                  {t('page.otherPaths.needTitle')}
                </h3>
                <p className="text-sm text-text-secondary mb-2">
                  {t('page.otherPaths.needBody')}
                </p>
                <span className="text-sm font-medium text-action">
                  {t('page.otherPaths.needCta')} →
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
