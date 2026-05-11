// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Store, ShoppingCart, MapPin, Clock, ExternalLink, Map as MapIcon, Shield } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SHOPWARE_URL, STORE_ADDRESS, STORE_GOOGLE_MAPS_URL, STORE_OSM_URL } from '@/lib/constants'
import { ORG, OPENING_HOURS } from '@/config/org'
import { PageHero } from '@/components/layout/PageHero'
import { getTranslations } from 'next-intl/server'

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

      {/* Routing Options */}
      <section className="py-12 sm:py-16 md:py-20 bg-white" id="routing">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Physical Store */}
            <Card className="overflow-hidden border-neutral-200">
              <CardHeader className="bg-primary-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-600 text-white flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle id="ladenlokal">{t('page.store.title')}</CardTitle>
                    <p className="text-sm text-neutral-600">{t('page.store.tagline')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 w-5 h-5 text-primary-700" />
                  <div>
                    <p className="font-medium text-neutral-900">{STORE_ADDRESS}</p>
                    <p className="text-sm text-neutral-600">
                      {t('page.store.accessInfo')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 w-5 h-5 text-primary-700" />
                  <div>
                    <p className="font-medium text-neutral-900">{t('page.store.openingHours')}</p>
                    <p className="text-sm text-neutral-600">
                      {t('page.store.openingHoursMonday', { hours: OPENING_HOURS.monday })}
                      <br />
                      {t('page.store.openingHoursTueFri', { hours: OPENING_HOURS.tuesdayToFriday })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a href={STORE_GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    <MapPin className="w-4 h-4 mr-2" /> {t('page.store.openGoogleMaps')}
                  </a>
                  <a href={STORE_OSM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    <MapIcon className="w-4 h-4 mr-2" /> {t('page.store.openOsm')}
                  </a>
                  <Link href="/contact" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    {t('page.store.contact')}
                  </Link>
                </div>
                <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 w-4 h-4 text-primary-700" />
                    <div>
                      <p className="font-medium text-neutral-900 mb-1">{t('page.store.mapsInfoTitle')}</p>
                      <p>{t('page.store.mapsInfoBody')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Online Shops */}
            <Card className="overflow-hidden border-neutral-200">
              <CardHeader className="bg-info-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-info-600 text-white flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>{t('page.online.title')}</CardTitle>
                    <p className="text-sm text-neutral-600">
                      {t('page.online.tagline')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc list-inside text-neutral-700 space-y-1">
                  <li>{t('page.online.benefit1')}</li>
                  <li>{t('page.online.benefit2')}</li>
                  <li>{t('page.online.benefit3')}</li>
                </ul>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href={SHOPWARE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> {t('page.online.shopwareShop')}
                  </a>
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary-600 text-white hover:bg-primary-700 h-10 px-4 py-2"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" /> {t('page.online.onlineShop', { orgName: ORG.name })}
                  </Link>
                </div>
                <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 w-4 h-4 text-info-700" />
                    <div>
                      <p className="font-medium text-neutral-900 mb-1">{t('page.online.multiShopTitle')}</p>
                      <p>{t('page.online.multiShopBody', { orgName: ORG.name })}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
