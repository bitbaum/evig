// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import {
  MapPin,
  Clock,
  Store,
  Wrench,
  Users,
  BookOpen,
  Coffee,
  UtensilsCrossed,
  Heart,
  TrendingUp,
  Calendar,
  ChevronRight,
  ExternalLink,
  Building2,
  Sparkles,
  Target,
  Leaf
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { IconBadge } from '@/components/ui/IconBadge'
import { STORE_ADDRESS, STORE_GOOGLE_MAPS_URL, STORE_OSM_URL } from '@/lib/constants'
import { ORG, LOCATIONS, OPENING_HOURS } from '@/config/org'
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

// Icons for location history (positional — parallel to translations array)
const locationIcons = [MapPin, MapPin, MapPin, MapPin]

// current flags (positional — last one is current)
const locationCurrentFlags = [false, false, false, true]

// Periods (not translatable — they are dates)
const locationPeriods = ['2003 - 2008', '2008 - 2012', '2012 - 2015', '2015 -']

// Location proper names (not translatable)
const locationNames = [
  'Toni Molkerei',
  'Reformierte Kirche Wipkingen',
  'Röschibachstrasse',
  LOCATIONS.store.street,
]

// Space feature icons (positional — parallel to translations array)
const spaceFeatureIcons = [Store, Wrench, Users, Calendar, BookOpen, Coffee, UtensilsCrossed, Leaf]

export default async function SpacePage({ params }: SpacePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'space' })

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
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Link href="#zukunft">
            <Button size="lg" className="bg-primary-600 text-white hover:bg-primary-700">
              <Sparkles className="w-5 h-5 mr-2" />
              {t('hero.visionBtn')}
            </Button>
          </Link>
          <Link href="/get-involved/donate">
            <Button size="lg" variant="outline-light">
              <Heart className="w-5 h-5 mr-2" />
              {t('hero.donateBtn')}
            </Button>
          </Link>
        </div>
      </PageHero>

      {/* Timeline / History */}
      <section className="py-16 md:py-20 bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Heading level={2} className="text-3xl md:text-4xl mb-4">{t('history.title')}</Heading>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              {t('history.subtitle')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary-200 hidden md:block" />

              <div className="space-y-8">
                {historyLocations.map((location, index) => {
                  const isCurrent = locationCurrentFlags[index]
                  return (
                    <div key={index} className="relative flex gap-6 md:gap-8">
                      {/* Timeline dot */}
                      <div className={`hidden md:flex w-16 h-16 rounded-full items-center justify-center flex-shrink-0 z-10 ${
                        isCurrent
                          ? 'bg-primary-600 text-white'
                          : 'bg-white border-2 border-primary-300 text-primary-700 dark:text-primary-300'
                      }`}>
                        <MapPin className="w-6 h-6" />
                      </div>

                      <Card className={`flex-1 ${isCurrent ? 'ring-2 ring-primary-500' : ''}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <p className="text-sm font-medium text-primary-600 mb-1">{locationPeriods[index]}</p>
                              <CardTitle className="text-xl">{locationNames[index]}</CardTitle>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isCurrent
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}>
                              {location.highlight}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-neutral-600">
                            {location.description.replace('{warehouseStreet}', LOCATIONS.warehouse.street)}
                          </p>
                          {isCurrent && (
                            <div className="mt-4 pt-4 border-t border-neutral-100">
                              <p className="text-sm font-medium text-neutral-900 mb-2">{STORE_ADDRESS}</p>
                              <div className="flex flex-wrap gap-2">
                                <a
                                  href={STORE_GOOGLE_MAPS_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center"
                                >
                                  Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                                <span className="text-neutral-300">|</span>
                                <a
                                  href={STORE_OSM_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center"
                                >
                                  OpenStreetMap <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Current Location Quick Info */}
      <section className="py-12 bg-white border-y border-neutral-200">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <IconBadge icon={Store} theme="space" size="lg" shape="circle" />
              <div>
                <p className="font-semibold text-neutral-900">{t('currentLocation.label')}</p>
                <p className="text-neutral-600">{STORE_ADDRESS}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <IconBadge icon={Clock} theme="space" size="lg" shape="circle" />
              <div>
                <p className="font-semibold text-neutral-900">{t('currentLocation.hoursLabel')}</p>
                <p className="text-neutral-600">
                  {t('currentLocation.hoursText', { monday: OPENING_HOURS.monday, tueFri: OPENING_HOURS.tuesdayToFriday })}
                </p>
              </div>
            </div>
            <Link href="/shop#ladenlokal">
              <Button variant="outline">
                {t('currentLocation.moreBtn')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Future Space Vision */}
      <section id="zukunft" className="py-16 md:py-24 bg-neutral-50 dark:bg-neutral-900">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300 px-4 py-2 rounded-full mb-6">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{t('future.moveDeadline')}</span>
            </div>
            <Heading level={2} className="text-3xl md:text-4xl mb-4">{t('future.title')}</Heading>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              {t('future.subtitle')}
            </p>
          </div>

          {/* Vision Image Placeholder */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="relative aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/[0.08]">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <Sparkles className="w-16 h-16 text-primary-600 mb-4" />
                <p className="text-xl font-semibold text-primary-800 dark:text-primary-300 mb-2">
                  {t('future.visionTagline', { orgName: ORG.name })}
                </p>
                <p className="text-primary-700 dark:text-primary-300 max-w-md">
                  {t('future.visionDesc')}
                </p>
              </div>
            </div>
            <p className="text-sm text-neutral-500 text-center mt-3">
              {t('future.visionCaption')}
            </p>
          </div>

          {/* Space Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto mb-16">
            {spaceFeatures.map((feature, index) => {
              const Icon = spaceFeatureIcons[index]
              return (
                <Card key={index} className="text-center p-4 hover:shadow-md transition-shadow">
                  {Icon && <IconBadge icon={Icon} theme="space" size="lg" shape="circle" className="mx-auto mb-3" />}
                  <Heading level={3} className="font-semibold text-neutral-900 mb-1">{feature.name}</Heading>
                  <p className="text-sm text-neutral-600">{feature.description}</p>
                </Card>
              )
            })}
          </div>

          {/* Parameters */}
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-600" />
                {t('future.params.title')}
              </CardTitle>
              <CardDescription>
                {t('future.params.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <p className="text-3xl font-bold text-primary-700 dark:text-primary-300 mb-1">{t('future.params.areaValue')}</p>
                  <p className="text-sm text-neutral-600">{t('future.params.areaLabel')}</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <p className="text-3xl font-bold text-primary-700 dark:text-primary-300 mb-1">{t('future.params.budgetValue')}</p>
                  <p className="text-sm text-neutral-600">{t('future.params.budgetLabel')}</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <p className="text-3xl font-bold text-primary-700 dark:text-primary-300 mb-1">{t('future.params.locationValue')}</p>
                  <p className="text-sm text-neutral-600">{t('future.params.locationLabel')}</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                <p className="text-sm text-neutral-700">
                  {t('future.params.ideal')}
                </p>
              </div>
              <div className="mt-4 text-center">
                <p className="text-neutral-600 mb-4">
                  {t('future.params.knowSpace')}
                </p>
                <Link href="/contact">
                  <Button>
                    {t('future.params.contactBtn')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* KPI Impact / Why Donate */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl md:text-4xl mb-4">
                {t('impact.title')}
              </Heading>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                {t('impact.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {kpis.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                          {item.metric}
                        </p>
                      </div>
                      <TrendingUp className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex items-end gap-4 mb-3">
                      <div>
                        <p className="text-sm text-neutral-500">{t('impact.todayLabel')}</p>
                        <p className="text-2xl font-bold text-neutral-400">{item.current}</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-primary-500 mb-2" />
                      <div>
                        <p className="text-sm text-primary-600">{t('impact.potentialLabel')}</p>
                        <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">{item.potential}</p>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600">{item.reason}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Donation CTA */}
            <Card className="bg-primary-600 text-white">
              <CardContent className="p-8 text-center">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-90" />
                <Heading level={3} className="text-2xl mb-3">
                  {t('impact.donateCard.title')}
                </Heading>
                <p className="text-primary-100 max-w-xl mx-auto mb-6">
                  {t('impact.donateCard.body')}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/get-involved/donate">
                    <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                      <Heart className="w-5 h-5 mr-2" />
                      {t('impact.donateCard.donateBtn')}
                    </Button>
                  </Link>
                  <Link href="/about/impact">
                    <Button size="lg" variant="outline-light">
                      {t('impact.donateCard.impactBtn')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Links to Shop Options */}
      <section className="py-12 bg-neutral-50 border-t border-neutral-200">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <Heading level={3} className="text-xl mb-2">{t('shopLinks.title')}</Heading>
            <p className="text-neutral-600">{t('shopLinks.subtitle')}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/shop#ladenlokal">
              <Button variant="outline">
                <Store className="w-4 h-4 mr-2" /> {t('shopLinks.currentStore')}
              </Button>
            </Link>
            <Link href={ROUTES.public.shop}>
              <Button variant="outline">
                <Store className="w-4 h-4 mr-2" /> {t('shopLinks.shopOverview')}
              </Button>
            </Link>
            <Link href={ROUTES.public.marketplace}>
              <Button>
                {t('shopLinks.onlineShop')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
