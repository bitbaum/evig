// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import {
  ArrowRight,
  ExternalLink,
  HandHelping,
  Heart,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  Store,
  Wrench,
} from 'lucide-react'
import { SHOPWARE_URL, STORE_ADDRESS, STORE_GOOGLE_MAPS_URL } from '@/lib/constants'
import { ORG, OPENING_HOURS } from '@/config/org'
import { MissionStrip } from '@/components/commerce/MissionStrip'
import { ProductCard } from '@/components/shop/ProductCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getTranslations } from 'next-intl/server'
import { ROUTES } from '@/config/routes'
import { SHOP_CATEGORIES, getCategoryUrl } from '@/config/shop'
import { getInventoryProducts } from '@/lib/services/inventory-service'

interface ShopPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'shop' })
  const title = t('meta.title')
  const description = t('page.metaDescription', { orgName: ORG.name })
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'shop' })
  const inventory = await getInventoryProducts({ limit: 12, offset: 0 }).catch(() => ({
    products: [],
    total: 0,
    limit: 12,
    offset: 0,
  }))
  const categories = SHOP_CATEGORIES.slice(0, 8)

  return (
    <main className="bg-surface-base">
      <section className="border-b border-subtle bg-surface-base py-10 sm:py-14 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
          <div>
            <div className="ui-public-eyebrow">{t('page.heroEyebrow')}</div>
            <h1 className="ui-public-display-lg mt-4 max-w-4xl">{t('page.heroTitle')}</h1>
            <p className="ui-public-section-lede mt-5 max-w-2xl">{t('page.heroSubtitle')}</p>

            <form action={ROUTES.public.shopSearch} method="GET" className="mt-8 max-w-2xl">
              <div className="flex min-h-touch overflow-hidden rounded-lg border border-subtle bg-surface-raised shadow-xs focus-within:border-strong">
                <label htmlFor="shop-search" className="sr-only">{t('search.placeholder')}</label>
                <div className="flex flex-1 items-center gap-3 px-4">
                  <Search className="h-5 w-5 shrink-0 text-text-tertiary" aria-hidden="true" />
                  <Input
                    id="shop-search"
                    name="q"
                    type="search"
                    placeholder={t('search.placeholder')}
                    className="h-12 w-full border-0 bg-transparent px-0 text-sm text-text-primary shadow-none outline-none placeholder:text-text-tertiary focus-visible:ring-0"
                  />
                </div>
                <Button type="submit" variant="primary" className="rounded-none border-0 px-5">
                  {t('search.submitButton')}
                </Button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={getCategoryUrl(category.slug)}
                  className="rounded-full border border-subtle bg-surface-raised px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:border-strong hover:text-action"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <aside className="border-l-0 border-subtle lg:border-l lg:pl-8">
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-action" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-text-primary">{t('page.trust.qualityTitle')}</p>
                  <p className="mt-1 text-text-tertiary">{t('page.trust.qualityBody')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Store className="mt-0.5 h-5 w-5 shrink-0 text-action" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-text-primary">{t('page.store.title')}</p>
                  <p className="mt-1 text-text-tertiary">{STORE_ADDRESS}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="mt-0.5 h-5 w-5 shrink-0 text-action" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-text-primary">{t('page.trust.stockTitle', { count: inventory.total })}</p>
                  <p className="mt-1 text-text-tertiary">{t('page.trust.stockBody')}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <MissionStrip />

      <section id="products" className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="ui-public-eyebrow">{t('page.products.eyebrow')}</div>
              <h2 className="ui-public-display-md mt-3">{t('page.products.title')}</h2>
              <p className="ui-public-section-lede mt-3 max-w-2xl">{t('page.products.body')}</p>
            </div>
            <Link href={ROUTES.public.shopSearch} className="ui-public-cta-ghost inline-flex items-center gap-2 self-start sm:self-auto">
              {t('page.products.allCta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {inventory.products.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {inventory.products.map((product) => (
                <ProductCard key={product.id} product={product} stockOneLabel={t('product.stockOne')} />
              ))}
            </div>
          ) : (
            <div className="border-y border-subtle py-12 text-center">
              <Package className="mx-auto h-10 w-10 text-text-tertiary" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-text-primary">{t('page.products.emptyTitle')}</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm text-text-tertiary">{t('page.products.emptyBody')}</p>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-subtle py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <article className="lg:col-span-2">
            <div className="ui-public-eyebrow">{t('page.repair.eyebrow')}</div>
            <h2 className="ui-public-display-md mt-3">{t('page.repair.title')}</h2>
            <p className="ui-public-section-lede mt-3 max-w-2xl">{t('page.repair.body')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={ROUTES.public.itHilfeCreate} className="ui-public-cta inline-flex items-center gap-2">
                <Wrench className="h-4 w-4" aria-hidden="true" />
                {t('page.repair.requestCta')}
              </Link>
              <Link href={ROUTES.public.techniker} className="ui-public-cta-ghost inline-flex items-center gap-2">
                {t('page.repair.techniciansCta')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>

          <article id="ladenlokal" className="border-l-0 border-subtle lg:border-l lg:pl-8">
            <div className="ui-public-eyebrow">{t('page.store.eyebrow')}</div>
            <h3 className="mt-3 text-xl font-semibold text-text-primary">{t('page.store.title')}</h3>
            <p className="mt-2 text-sm text-text-tertiary">{t('page.store.tagline')}</p>
            <div className="mt-4 space-y-3 text-sm text-text-secondary">
              <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden="true" />{STORE_ADDRESS}</p>
              <p>{t('page.store.openingHoursMonday', { hours: OPENING_HOURS.monday })}</p>
              <p>{t('page.store.openingHoursTueFri', { hours: OPENING_HOURS.tuesdayToFriday })}</p>
            </div>
            <a href={STORE_GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-action hover:text-action-hover">
              {t('page.store.openGoogleMaps')}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </article>
        </div>
      </section>

      <section className="border-t border-subtle bg-surface-raised py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="ui-public-eyebrow">{t('page.legacy.eyebrow')}</div>
            <h2 className="mt-2 text-xl font-semibold text-text-primary">{t('page.legacy.title')}</h2>
            <p className="mt-2 max-w-2xl text-sm text-text-tertiary">{t('page.legacy.body')}</p>
          </div>
          <a href={SHOPWARE_URL} target="_blank" rel="noopener noreferrer" className="ui-public-cta-ghost inline-flex items-center gap-2 self-start lg:self-auto">
            {t('page.legacy.cta')}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="border-t border-subtle py-12 sm:py-16" aria-label={t('page.otherPaths.altTitle')}>
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          <Link href="/projects/compirat" className="ui-public-start-card group">
            <HandHelping className="mb-4 h-6 w-6 text-action" aria-hidden="true" />
            <h3 className="ui-public-start-card-title transition-colors group-hover:text-action">{t('page.otherPaths.needTitle')}</h3>
            <p className="ui-public-start-card-body">{t('page.otherPaths.needBody')}</p>
            <span className="ui-public-start-card-link">{t('page.otherPaths.needCta')} →</span>
          </Link>

          <Link href={ROUTES.public.donate} className="ui-public-start-card group">
            <Heart className="mb-4 h-6 w-6 text-action" aria-hidden="true" />
            <h3 className="ui-public-start-card-title transition-colors group-hover:text-action">{t('page.otherPaths.donateTitle')}</h3>
            <p className="ui-public-start-card-body">{t('page.otherPaths.donateBody')}</p>
            <span className="ui-public-start-card-link">{t('page.otherPaths.donateCta')} →</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
