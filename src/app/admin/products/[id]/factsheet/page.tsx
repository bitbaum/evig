'use client'

/**
 * Product Fact Sheet / Sales Label
 * A4-sized printable sales sheet with QR code
 *
 * Route: /admin/products/[id]/factsheet
 */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Printer,
  Heart,
  Briefcase,
  Tv,
  Gamepad2,
  Palette,
  Code,
  GraduationCap,
  Package,
  Shield,
  Leaf,
  ArrowLeft,
  Smartphone,
} from 'lucide-react'
import { CUSTOMER_PROFILES } from '@/config/erfassung/profiles'
import { CONDITION_COLORS } from '@/config/ui-colors'
import Heading from '@/components/ui/Heading'

// Profile icons mapped by slug
const PROFILE_ICONS: Record<string, React.ReactNode> = {
  oma: <Heart className="w-5 h-5" />,
  buero: <Briefcase className="w-5 h-5" />,
  chiller: <Tv className="w-5 h-5" />,
  gamer: <Gamepad2 className="w-5 h-5" />,
  kreativ: <Palette className="w-5 h-5" />,
  dev: <Code className="w-5 h-5" />,
  student: <GraduationCap className="w-5 h-5" />,
}

// Derive PROFILES from CUSTOMER_PROFILES SSOT
const PROFILES: Record<string, { name: string; icon: React.ReactNode; color: string }> = Object.fromEntries(
  CUSTOMER_PROFILES
    .filter(p => PROFILE_ICONS[p.slug])
    .map(p => [p.slug, { name: p.name_de, icon: PROFILE_ICONS[p.slug], color: p.color }])
)

const CONDITION_CONFIG = CONDITION_COLORS

interface ProductData {
  id: string
  item_uuid: string
  product_name: string
  brand: string
  short_description: string | null
  specifications: Record<string, string>
  estimated_price_chf: number
  condition: string
  dimensions: {
    laenge_mm: number | null
    breite_mm: number | null
    hoehe_mm: number | null
  }
  weight_grams: number | null
  category: string | null
  subcategory: string | null
  location: string | null
  box_id: string | null
  quantity_available: number
  customer_profiles: string[]
  created_at: string
  image_url: string | null
}

export default function FactSheetPage() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/admin/inventory/${productId}`)
        if (!response.ok) {
          throw new Error('Produkt nicht gefunden')
        }
        const data = await response.json()
        if (data.success && data.data?.product) {
          setProduct({ ...data.data.product, id: productId })
        } else {
          throw new Error(data.error || 'Produkt nicht gefunden')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <Heading level={2} className="text-xl font-semibold text-gray-900">
            {error || 'Produkt nicht gefunden'}
          </Heading>
        </div>
      </div>
    )
  }

  const condition = CONDITION_CONFIG[product.condition] || {
    label: product.condition,
    color: '#6B7280',
    bgColor: '#F3F4F6'
  }
  const specs = product.specifications || {}
  const specEntries = Object.entries(specs).slice(0, 8) // Limit to 8 specs for layout
  const shopUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/marketplace/${product.id}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shopUrl)}&bgcolor=ffffff&color=16a34a`

  return (
    <>
      {/* Print Controls - Hidden in print */}
      <div className="print:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 px-4 py-3">
        <div className="max-w-[210mm] mx-auto flex items-center justify-between">
          <a
            href="/admin/products"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              A4 Factsheet - {product.brand} {product.product_name}
            </span>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Drucken
            </button>
          </div>
        </div>
      </div>

      {/* A4 Fact Sheet */}
      <div className="bg-gray-100 min-h-screen pt-16 pb-8 print:pt-0 print:pb-0 print:bg-white">
        <div className="factsheet-page w-[210mm] min-h-[297mm] mx-auto bg-white shadow-lg print:shadow-none">

          {/* Green Header Bar */}
          <div className="bg-green-600 text-white px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-green-600 font-bold text-2xl">R</span>
                </div>
                <div>
                  <Heading level={1} className="text-2xl font-bold tracking-tight">Revamp-IT</Heading>
                  <p className="text-green-100 text-sm">Nachhaltige IT - Gut für dich, gut für die Umwelt</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-200 text-xs uppercase tracking-wider">Artikel-Nr.</div>
                <div className="text-xl font-mono font-bold">{product.item_uuid}</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-8 py-6">

            {/* Product Hero Section */}
            <div className="flex gap-6 mb-6">
              {/* Product Image */}
              <div className="w-48 h-48 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-gray-200 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.product_name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Package className="w-20 h-20 text-gray-300" />
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <div className="text-gray-500 text-sm font-medium mb-1">{product.brand}</div>
                <Heading level={2} className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                  {product.product_name}
                </Heading>
                {product.short_description && (
                  <p className="text-gray-600 text-base mb-4 leading-relaxed">
                    {product.short_description}
                  </p>
                )}

                {/* Condition Badge */}
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: condition.bgColor, color: condition.color }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: condition.color }}></span>
                  Zustand: {condition.label}
                </div>
              </div>

              {/* Price Box */}
              <div className="w-44 flex-shrink-0">
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 text-center">
                  <div className="text-green-700 text-sm font-medium mb-1">Ihr Preis</div>
                  <div className="text-4xl font-bold text-green-600 mb-1">
                    {Number(product.estimated_price_chf).toFixed(0)}.-
                  </div>
                  <div className="text-green-600 text-sm">CHF inkl. MwSt.</div>
                </div>
                {product.quantity_available > 0 && product.quantity_available <= 3 && (
                  <div className="mt-2 text-center text-orange-600 text-sm font-medium">
                    Nur noch {product.quantity_available} verfügbar!
                  </div>
                )}
              </div>
            </div>

            {/* Technical Specs */}
            {specEntries.length > 0 && (
              <div className="mb-6">
                <Heading level={3} className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-200">
                  Technische Daten
                </Heading>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {specEntries.map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">{key}</span>
                      <span className="text-gray-900 font-semibold text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Who is this for? */}
            {product.customer_profiles && product.customer_profiles.length > 0 && (
              <div className="mb-6">
                <Heading level={3} className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-200">
                  Perfekt geeignet für
                </Heading>
                <div className="flex flex-wrap gap-3">
                  {product.customer_profiles.map((slug) => {
                    const profile = PROFILES[slug]
                    if (!profile) return null
                    return (
                      <div
                        key={slug}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
                        style={{ backgroundColor: profile.color }}
                      >
                        {profile.icon}
                        {profile.name}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Trust Badges + QR Code */}
            <div className="flex gap-6 mt-auto">
              {/* Trust Badges */}
              <div className="flex-1">
                <Heading level={3} className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-200">
                  Ihre Vorteile
                </Heading>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Geprüfte Qualität</div>
                      <div className="text-sm text-gray-600">Jedes Gerät wird getestet</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Leaf className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Nachhaltig</div>
                      <div className="text-sm text-gray-600">IT ein zweites Leben geben</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="w-48 flex-shrink-0 text-center">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-3 inline-block">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code zum Online-Shop"
                    className="w-32 h-32 mx-auto"
                  />
                </div>
                <div className="mt-2 flex items-center justify-center gap-1 text-gray-600 text-sm">
                  <Smartphone className="w-4 h-4" />
                  Online ansehen & kaufen
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="mt-auto px-8 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                <span className="font-medium">Revamp-IT</span> | Genossenschaft für nachhaltige IT
              </div>
              <div className="text-gray-500">
                revamp-it.ch | Zürich
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html, body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .factsheet-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            box-shadow: none;
            page-break-after: always;
          }
        }

        @media screen {
          .factsheet-page {
            /* Simulate A4 on screen */
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          }
        }
      `}</style>
    </>
  )
}
