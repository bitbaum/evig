// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { notFound } from 'next/navigation'
import { ChevronRight, Home, Package, ShoppingCart, Shield, Tag, Layers } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'
import {
  getInventoryProductByUuid,
  getInventoryProducts,
  type InventoryProduct,
} from '@/lib/services/inventory-service'
import { SHOPWARE_URL } from '@/lib/constants'
import { APP_URL } from '@/config/urls'
import { safeJsonLd } from '@/lib/seo/json-ld'
import { formatCHF } from '@/config/marketplace'

interface ProductPageProps {
  params: Promise<{ locale: string; uuid: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, uuid } = await params
  const t = await getTranslations({ locale, namespace: 'shop.meta' })
  const product = await getInventoryProductByUuid(uuid).catch(() => null)
  if (!product) return { title: t('productNotFound') }
  const title = `${product.title} | ${ORG.name}`
  const description = product.description ?? t('productFallbackDesc', { brand: product.brand, model: product.model, orgName: ORG.name })
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(product.image_url && {
        images: [{ url: product.image_url, alt: product.title }],
      }),
    },
  }
}

function mapConditionToSchema(condition: string): string {
  switch (condition.toLowerCase()) {
    case 'wie neu': return 'https://schema.org/NewCondition'
    default: return 'https://schema.org/UsedCondition'
  }
}

// Condition badge colors (labels come from translations)
const CONDITION_COLORS: Record<string, string> = {
  'wie neu':    'bg-primary-100 text-primary-800',
  'sehr gut':   'bg-primary-100 text-primary-800',
  'gut':        'bg-neutral-100 text-neutral-800',
  'akzeptabel': 'bg-warning-100 text-warning-800',
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, uuid } = await params
  const t = await getTranslations({ locale, namespace: 'shop' })

  const product = await getInventoryProductByUuid(uuid).catch(() => null)
  if (!product) notFound()

  // Similar products
  const similar = await getInventoryProducts({
    limit: 4,
    offset: 0,
    category: product.category ?? undefined,
  }).catch(() => ({ products: [] as InventoryProduct[], total: 0, limit: 4, offset: 0 }))
  const relatedProducts = similar.products.filter(p => p.id !== product.id).slice(0, 3)

  const conditionKey = product.condition.toLowerCase()
  const conditionColor = CONDITION_COLORS[conditionKey] ?? 'bg-neutral-100 text-neutral-800'
  const CONDITION_LABEL_MAP: Record<string, string> = {
    'wie neu': t('product.conditionLabels.wieNeu'),
    'sehr gut': t('product.conditionLabels.sehrGut'),
    'gut': t('product.conditionLabels.gut'),
    'akzeptabel': t('product.conditionLabels.akzeptabel'),
  }
  const conditionLabel = CONDITION_LABEL_MAP[conditionKey] ?? product.condition

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    ...(product.description && { description: product.description }),
    ...(product.image_url && { image: product.image_url }),
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      price: String(product.price.toFixed(2)),
      priceCurrency: 'CHF',
      availability: 'https://schema.org/InStock',
      itemCondition: mapConditionToSchema(product.condition),
      url: `${APP_URL}/shop/product/${uuid}`,
      seller: { '@type': 'Organization', name: ORG.name },
    },
  }

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
    />
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Breadcrumbs */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <Link href="/" className="hover:text-primary-600 transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
            <Link href="/shop" className="hover:text-primary-600 transition-colors">Shop</Link>
            {product.category && (
              <>
                <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
                <span className="text-neutral-900 dark:text-white font-medium truncate max-w-[200px]">{product.category}</span>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
            <span className="text-neutral-900 dark:text-white font-medium truncate max-w-[200px]">{product.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="relative aspect-square">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  className="object-contain p-8"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-neutral-50 dark:bg-neutral-900">
                  <Package className="w-24 h-24 text-neutral-200 dark:text-neutral-700" />
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-1">
                {product.brand}
              </p>
              <Heading level={1} className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white leading-tight">
                {product.title}
              </Heading>
              {product.description && (
                <p className="mt-3 text-neutral-600 dark:text-neutral-400">{product.description}</p>
              )}
            </div>

            {/* Price & condition */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary-600" />
                <span className="text-3xl font-bold text-primary-700">
                  {formatCHF(product.price)}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${conditionColor}`}>
                {conditionLabel}
              </span>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${product.quantity > 0 ? 'bg-primary-500' : 'bg-error-400'}`} />
              <span className={product.quantity > 0 ? 'text-primary-700 font-medium' : 'text-error-600'}>
                {product.quantity > 1
                  ? t('product.stockMany', { count: product.quantity })
                  : product.quantity === 1
                  ? t('product.stockOne')
                  : t('product.outOfStock')}
              </span>
            </div>

            {/* Customer profiles */}
            {product.customer_profiles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  {t('product.suitableFor')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.customer_profiles.map(profile => (
                    <span
                      key={profile.slug}
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: `${profile.color}20`, color: profile.color }}
                    >
                      {profile.name_de}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trust badge */}
            <div className="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
              <Shield className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-primary-900 dark:text-primary-100">{t('product.verifiedTitle')}</p>
                <p className="text-primary-700 dark:text-primary-300 mt-0.5">
                  {t('product.verifiedDesc', { orgName: ORG.name })}
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={SHOPWARE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {t('product.buyOnline')}
              </a>
              <Link
                href="/shop#ladenlokal"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {t('product.buyInStore')}
              </Link>
            </div>
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <Heading level={2} className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">
              {t('product.similarProducts')}
            </Heading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedProducts.map(p => (
                <Link
                  key={p.id}
                  href={`/shop/product/${p.item_uuid}`}
                  className="group bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-neutral-50 dark:bg-neutral-900">
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.title}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-10 h-10 text-neutral-200 dark:text-neutral-700" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wide">{p.brand}</p>
                    <h3 className="font-medium text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2 mt-0.5">
                      {p.title}
                    </h3>
                    <p className="mt-2 font-bold text-primary-700">CHF {p.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
