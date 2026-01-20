'use client'

/**
 * Product Fact Sheet / Label Template
 * Printable HTML page for product labels
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
  Ruler,
  Weight,
  MapPin,
  Tag,
  CheckCircle2
} from 'lucide-react'

// Customer profile icons mapping
const PROFILE_ICONS: Record<string, React.ReactNode> = {
  oma: <Heart className="w-4 h-4" />,
  buero: <Briefcase className="w-4 h-4" />,
  chiller: <Tv className="w-4 h-4" />,
  gamer: <Gamepad2 className="w-4 h-4" />,
  kreativ: <Palette className="w-4 h-4" />,
  dev: <Code className="w-4 h-4" />,
  student: <GraduationCap className="w-4 h-4" />,
}

const PROFILE_COLORS: Record<string, string> = {
  oma: '#EC4899',
  buero: '#3B82F6',
  chiller: '#8B5CF6',
  gamer: '#EF4444',
  kreativ: '#F59E0B',
  dev: '#10B981',
  student: '#06B6D4',
}

const PROFILE_NAMES: Record<string, string> = {
  oma: 'Oma/Opa',
  buero: 'Büro',
  chiller: 'Chiller',
  gamer: 'Gamer',
  kreativ: 'Kreativ-Kopf',
  dev: 'Entwickler',
  student: 'Student',
}

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'Neu', color: '#10B981' },
  like_new: { label: 'Wie neu', color: '#22C55E' },
  good: { label: 'Gut', color: '#3B82F6' },
  fair: { label: 'Akzeptabel', color: '#F59E0B' },
  poor: { label: 'Gebraucht', color: '#EF4444' },
  damaged: { label: 'Beschädigt', color: '#DC2626' },
}

interface ProductData {
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
        setProduct(data.product)
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

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">
            {error || 'Produkt nicht gefunden'}
          </h2>
        </div>
      </div>
    )
  }

  const condition = CONDITION_LABELS[product.condition] || { label: product.condition, color: '#6B7280' }
  const specs = product.specifications || {}
  const hasSpecs = Object.keys(specs).length > 0
  const hasDimensions = product.dimensions?.laenge_mm || product.dimensions?.breite_mm || product.dimensions?.hoehe_mm

  return (
    <>
      {/* Print Button - Hidden in print */}
      <div className="print:hidden fixed top-4 right-4 z-50">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
        >
          <Printer className="w-5 h-5" />
          Drucken
        </button>
      </div>

      {/* Fact Sheet Container */}
      <div className="factsheet-container bg-white min-h-screen p-8 print:p-4">
        <div className="max-w-[210mm] mx-auto">

          {/* Header with Logo and Item UUID */}
          <header className="flex items-start justify-between border-b-2 border-green-600 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Revamp-IT</h1>
                <p className="text-sm text-gray-600">Nachhaltige IT für alle</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Artikel-Nr.</div>
              <div className="text-xl font-mono font-bold text-green-600">
                {product.item_uuid}
              </div>
            </div>
          </header>

          {/* Product Title Section */}
          <section className="mb-6">
            <div className="flex items-start gap-6">
              {/* Product Image Placeholder */}
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-dashed border-gray-300">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.product_name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Package className="w-12 h-12 text-gray-400" />
                )}
              </div>

              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">{product.brand}</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.product_name}
                </h2>
                {product.short_description && (
                  <p className="text-gray-600 text-sm">
                    {product.short_description}
                  </p>
                )}

                {/* Category badges */}
                <div className="flex items-center gap-2 mt-3">
                  {product.category && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {product.category}
                    </span>
                  )}
                  {product.subcategory && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {product.subcategory}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Price and Condition */}
          <section className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-700 mb-1">Verkaufspreis</div>
              <div className="text-3xl font-bold text-green-600">
                CHF {product.estimated_price_chf.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Zustand</div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className="w-6 h-6"
                  style={{ color: condition.color }}
                />
                <span
                  className="text-xl font-semibold"
                  style={{ color: condition.color }}
                >
                  {condition.label}
                </span>
              </div>
            </div>
          </section>

          {/* Technical Specifications */}
          {hasSpecs && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-600" />
                Technische Daten
              </h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(specs).map(([key, value], index) => (
                      <tr
                        key={key}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="px-4 py-2 font-medium text-gray-700 w-1/3 border-r border-gray-200">
                          {key}
                        </td>
                        <td className="px-4 py-2 text-gray-900">
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Physical Properties */}
          <section className="grid grid-cols-3 gap-4 mb-6">
            {hasDimensions && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Ruler className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wide">Masse</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {[
                    product.dimensions.laenge_mm && `${product.dimensions.laenge_mm}mm`,
                    product.dimensions.breite_mm && `${product.dimensions.breite_mm}mm`,
                    product.dimensions.hoehe_mm && `${product.dimensions.hoehe_mm}mm`,
                  ].filter(Boolean).join(' × ')}
                </div>
              </div>
            )}

            {product.weight_grams && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Weight className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wide">Gewicht</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {product.weight_grams >= 1000
                    ? `${(product.weight_grams / 1000).toFixed(2)} kg`
                    : `${product.weight_grams} g`
                  }
                </div>
              </div>
            )}

            {(product.location || product.box_id) && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wide">Lagerort</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {[product.location, product.box_id].filter(Boolean).join(' / ')}
                </div>
              </div>
            )}
          </section>

          {/* Customer Profiles */}
          {product.customer_profiles && product.customer_profiles.length > 0 && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Empfohlen für
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.customer_profiles.map((profileSlug) => {
                  const color = PROFILE_COLORS[profileSlug] || '#6B7280'
                  const name = PROFILE_NAMES[profileSlug] || profileSlug
                  const icon = PROFILE_ICONS[profileSlug]

                  return (
                    <div
                      key={profileSlug}
                      className="flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm font-medium"
                      style={{ backgroundColor: color }}
                    >
                      {icon}
                      {name}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="border-t border-gray-200 pt-4 mt-8">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div>
                Erfasst am {new Date(product.created_at).toLocaleDateString('de-CH')}
              </div>
              <div>
                Lager: {product.quantity_available} Stück verfügbar
              </div>
              <div>
                revamp-it.ch
              </div>
            </div>
          </footer>

        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .factsheet-container {
            padding: 0 !important;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}
