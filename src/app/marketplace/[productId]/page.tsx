/**
 * Marketplace Product Detail Page
 * Server component that displays full product details from marketplace listings
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { getConditionBadge } from '@/config/erfassung/conditions'
import {
  ArrowLeft,
  MapPin,
  Star,
  Shield,
  Package,
  User,
  Clock,
  Mail,
} from 'lucide-react'

interface ProductDetail {
  id: string
  title: string
  description: string
  price_chf: number
  condition: string
  category: string
  subcategory: string | null
  brand: string | null
  model: string | null
  location: string | null
  original_image_url: string | null
  quantity_available: number
  selling_price_chf: number | null
  published_at: string
  seller_name: string
  seller_email: string | null
  seller_verified: boolean
  seller_rating: number
  is_featured: boolean
  views_count: number
}

// Condition labels and colors from SSOT: @/config/erfassung/conditions

async function getProduct(productId: string): Promise<ProductDetail | null> {
  try {
    // Increment view count
    await query(
      `UPDATE ${TABLE_NAMES.MARKETPLACE_LISTINGS} SET views_count = views_count + 1 WHERE id = $1`,
      [productId]
    )

    const result = await query<ProductDetail>(
      `SELECT
        ml.id,
        ml.title,
        ml.description,
        ml.price_chf,
        ml.is_featured,
        ml.views_count,
        ml.published_at,
        COALESCE(ii.condition_override, aep.condition, 'good') as condition,
        COALESCE(aep.category, 'Allgemein') as category,
        aep.subcategory,
        aep.brand,
        aep.model,
        ii.location,
        aep.original_image_url,
        ii.quantity_available,
        ii.selling_price_chf,
        COALESCE(u.name, 'RevampIT') as seller_name,
        u.email as seller_email,
        CASE WHEN sp.id IS NOT NULL THEN sp.is_verified ELSE true END as seller_verified,
        COALESCE(sp.average_rating, 4.9) as seller_rating
       FROM ${TABLE_NAMES.MARKETPLACE_LISTINGS} ml
       LEFT JOIN ${TABLE_NAMES.INVENTORY_ITEMS} ii ON ml.inventory_item_id = ii.id
       LEFT JOIN ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} aep ON ii.ai_product_id = aep.id
       LEFT JOIN ${TABLE_NAMES.USERS} u ON ml.created_by = u.id
       LEFT JOIN ${TABLE_NAMES.SELLER_PROFILES} sp ON u.id = sp.user_id
       WHERE ml.id = $1 AND ml.status = 'published'`,
      [productId]
    )

    if (result.rows.length === 0) return null
    return result.rows[0]
  } catch (error) {
    logger.error('Error fetching product detail', { error, productId })
    return null
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ productId: string }> }
): Promise<Metadata> {
  const { productId } = await params
  const product = await getProduct(productId)

  if (!product) {
    return { title: 'Produkt nicht gefunden | RevampIT Marketplace' }
  }

  return {
    title: `${product.title} | RevampIT Marketplace`,
    description: product.description?.slice(0, 160),
  }
}

export default async function ProductDetailPage(
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  const product = await getProduct(productId)

  if (!product) {
    notFound()
  }

  const { label: conditionLabel, color: conditionColor } = getConditionBadge(product.condition)
  const hasDiscount = product.selling_price_chf && product.selling_price_chf > product.price_chf

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back navigation */}
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
            {product.original_image_url ? (
              <img
                src={product.original_image_url}
                alt={product.title}
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="w-full h-96 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Package className="w-24 h-24 text-gray-300 dark:text-gray-500" />
              </div>
            )}
            <div className="p-4 flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${conditionColor}`}>
                {conditionLabel}
              </span>
              {product.is_featured && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Empfohlen
                </span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title & Price */}
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span>{product.category}</span>
                {product.subcategory && (
                  <>
                    <span>/</span>
                    <span>{product.subcategory}</span>
                  </>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {product.title}
              </h1>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-green-600">
                  CHF {Number(product.price_chf).toFixed(0)}
                </span>
                {hasDiscount && (
                  <span className="text-xl text-gray-400 line-through">
                    CHF {Number(product.selling_price_chf).toFixed(0)}
                  </span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm space-y-4">
              {product.brand && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Marke</span>
                  <span className="font-medium text-gray-900 dark:text-white">{product.brand}</span>
                </div>
              )}
              {product.model && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Modell</span>
                  <span className="font-medium text-gray-900 dark:text-white">{product.model}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Zustand</span>
                <span className="font-medium text-gray-900 dark:text-white">{conditionLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Verfügbarkeit</span>
                <span className={`font-medium ${product.quantity_available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.quantity_available > 0 ? 'Auf Lager' : 'Nicht verfügbar'}
                </span>
              </div>
              {product.location && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Standort</span>
                  <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {product.location}
                  </span>
                </div>
              )}
            </div>

            {/* Contact / Buy CTA */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <a
                href={`mailto:shop@revamp-it.ch?subject=Anfrage: ${encodeURIComponent(product.title)}&body=Ich interessiere mich für: ${encodeURIComponent(product.title)} (CHF ${Number(product.price_chf).toFixed(0)})`}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Anfrage senden
              </a>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                Kontaktieren Sie uns für Kauf und Abholung
              </p>
            </div>

            {/* Seller Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Verkäufer</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{product.seller_name}</span>
                    {product.seller_verified && (
                      <Shield className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span>{Number(product.seller_rating).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Published date */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Veröffentlicht am {new Date(product.published_at).toLocaleDateString('de-CH')}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Beschreibung</h2>
          <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-line">
            {product.description}
          </div>
        </div>
      </div>
    </div>
  )
}
