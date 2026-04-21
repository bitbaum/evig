import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
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

interface ProductPageProps {
  params: Promise<{ locale: string; uuid: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { uuid } = await params
  const product = await getInventoryProductByUuid(uuid).catch(() => null)
  if (!product) return { title: 'Produkt nicht gefunden' }
  return {
    title: `${product.title} | ${ORG.name}`,
    description: product.description ?? `${product.brand} ${product.model} — geprüft und aufbereitet von ${ORG.name}`,
  }
}

// Condition badge
const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  'wie neu':     { label: 'Wie neu',       color: 'bg-emerald-100 text-emerald-800' },
  'sehr gut':    { label: 'Sehr gut',      color: 'bg-green-100 text-green-800' },
  'gut':         { label: 'Gut',           color: 'bg-blue-100 text-blue-800' },
  'akzeptabel':  { label: 'Akzeptabel',    color: 'bg-yellow-100 text-yellow-800' },
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

  const conditionInfo = CONDITION_LABELS[product.condition.toLowerCase()] ?? {
    label: product.condition,
    color: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-emerald-600 transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <Link href="/shop" className="hover:text-emerald-600 transition-colors">Shop</Link>
            {product.category && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.category}</span>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <Package className="w-24 h-24 text-gray-200" />
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                {product.brand}
              </p>
              <Heading level={1} className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                {product.title}
              </Heading>
              {product.description && (
                <p className="mt-3 text-gray-600">{product.description}</p>
              )}
            </div>

            {/* Price & condition */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                <span className="text-3xl font-bold text-emerald-700">
                  CHF {product.price.toFixed(2)}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${conditionInfo.color}`}>
                {conditionInfo.label}
              </span>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${product.quantity > 0 ? 'bg-emerald-500' : 'bg-red-400'}`} />
              <span className={product.quantity > 0 ? 'text-emerald-700 font-medium' : 'text-red-600'}>
                {product.quantity > 1
                  ? `${product.quantity} Stück verfügbar`
                  : product.quantity === 1
                  ? 'Letztes Stück'
                  : 'Ausverkauft'}
              </span>
            </div>

            {/* Customer profiles */}
            {product.customer_profiles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Geeignet für
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
            <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
              <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-emerald-900">Geprüft & aufbereitet</p>
                <p className="text-emerald-700 mt-0.5">
                  Alle Geräte werden von {ORG.name} sorgfältig geprüft, gereinigt und neu installiert.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={SHOPWARE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                Im Webshop kaufen
              </a>
              <Link
                href="/shop#ladenlokal"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Vor Ort kaufen
              </Link>
            </div>
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <Heading level={2} className="text-xl font-semibold text-gray-900 mb-6">
              Ähnliche Produkte
            </Heading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedProducts.map(p => (
                <Link
                  key={p.id}
                  href={`/shop/product/${p.item_uuid}`}
                  className="group bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-gray-50">
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
                        <Package className="w-10 h-10 text-gray-200" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{p.brand}</p>
                    <h3 className="font-medium text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mt-0.5">
                      {p.title}
                    </h3>
                    <p className="mt-2 font-bold text-emerald-700">CHF {p.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
