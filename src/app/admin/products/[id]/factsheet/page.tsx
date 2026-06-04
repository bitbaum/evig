'use client'

/**
 * Product Fact Sheet / Sales Label
 * A4-sized printable sales sheet with QR code
 *
 * Route: /admin/products/[id]/factsheet
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ROUTES } from '@/config/routes'
import { Button } from '@/components/ui/button'
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
import { ORG, LOCATIONS } from '@/config/org'
import { CONDITION_COLORS, PRINT_PREVIEW_SHADOW, PRODUCT_CONDITION_FALLBACK_COLORS } from '@/config/ui-colors'
import { apiFetch } from '@/lib/api/client'
import Heading from '@/components/admin/AdminHeading'

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
      const result = await apiFetch<{ product: Omit<ProductData, 'id'> }>(
        `/api/admin/inventory/${productId}`,
      )
      if (result.success && result.data?.product) {
        setProduct({ ...result.data.product, id: productId })
      } else {
        setError(result.error || 'Produkt nicht gefunden')
      }
      setLoading(false)
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-raised">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-raised">
        <div className="text-center">
          <Package className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <Heading level={2} className="text-xl font-semibold text-text-primary">
            {error || 'Produkt nicht gefunden'}
          </Heading>
        </div>
      </div>
    )
  }

  const condition = CONDITION_CONFIG[product.condition] || {
    label: product.condition,
    ...PRODUCT_CONDITION_FALLBACK_COLORS,
  }
  const specs = product.specifications || {}
  const specEntries = Object.entries(specs).slice(0, 8) // Limit to 8 specs for layout
  const shopUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/marketplace/${product.id}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shopUrl)}&bgcolor=ffffff&color=16a34a`

  return (
    <>
      {/* Print Controls - Hidden in print */}
      <div className="print:hidden fixed top-0 left-0 right-0 bg-surface-base border-b border z-50 px-4 py-3">
        <div className="max-w-[210mm] mx-auto flex items-center justify-between">
          <Link
            href={ROUTES.admin.products}
            className="flex items-center gap-2 text-text-secondary hover:text-neutral-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-tertiary">
              A4 Factsheet - {product.brand} {product.product_name}
            </span>
            <Button onClick={() => window.print()} variant="primary">
              <Printer className="w-5 h-5" />
              Drucken
            </Button>
          </div>
        </div>
      </div>

      {/* A4 Fact Sheet */}
      <div className="bg-surface-raised min-h-screen pt-16 pb-8 print:pt-0 print:pb-0 print:bg-white">
        <div className="factsheet-page w-[210mm] min-h-[297mm] mx-auto bg-surface-base shadow-lg print:shadow-none">

          {/* Green Header Bar */}
          <div className="bg-primary-600 text-white px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-surface-base rounded-xl flex items-center justify-center">
                  <span className="text-action font-bold text-2xl">R</span>
                </div>
                <div>
                  <Heading level={1} className="text-2xl font-bold tracking-tight">{ORG.name}</Heading>
                  <p className="text-primary-100 text-sm">Nachhaltige IT - Gut für dich, gut für die Umwelt</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-primary-200 text-xs uppercase tracking-wider">Artikel-Nr.</div>
                <div className="text-xl font-mono font-bold">{product.item_uuid}</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-8 py-6">

            {/* Product Hero Section */}
            <div className="flex gap-6 mb-6">
              {/* Product Image */}
              <div className="w-48 h-48 bg-surface-raised rounded-xl flex items-center justify-center shrink-0 border-2 border overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.product_name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Package className="w-20 h-20 text-neutral-300" />
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <div className="text-text-tertiary text-sm font-medium mb-1">{product.brand}</div>
                <Heading level={2} className="text-3xl font-bold text-text-primary mb-2 leading-tight">
                  {product.product_name}
                </Heading>
                {product.short_description && (
                  <p className="text-text-secondary text-base mb-4 leading-relaxed">
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
              <div className="w-44 shrink-0">
                <div className="bg-primary-50 border-2 border-primary-500 rounded-xl p-4 text-center">
                  <div className="text-primary-700 text-sm font-medium mb-1">Ihr Preis</div>
                  <div className="text-4xl font-bold text-action mb-1">
                    {Number(product.estimated_price_chf).toFixed(0)}.-
                  </div>
                  <div className="text-action text-sm">CHF inkl. MwSt.</div>
                </div>
                {product.quantity_available > 0 && product.quantity_available <= 3 && (
                  <div className="mt-2 text-center text-secondary-600 text-sm font-medium">
                    Nur noch {product.quantity_available} verfügbar!
                  </div>
                )}
              </div>
            </div>

            {/* Technical Specs */}
            {specEntries.length > 0 && (
              <div className="mb-6">
                <Heading level={3} className="text-lg font-bold text-text-primary mb-3 pb-2 border-b-2 border">
                  Technische Daten
                </Heading>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {specEntries.map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-subtle">
                      <span className="text-text-secondary font-medium">{key}</span>
                      <span className="text-text-primary font-semibold text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Who is this for? */}
            {product.customer_profiles && product.customer_profiles.length > 0 && (
              <div className="mb-6">
                <Heading level={3} className="text-lg font-bold text-text-primary mb-3 pb-2 border-b-2 border">
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
                <Heading level={3} className="text-lg font-bold text-text-primary mb-3 pb-2 border-b-2 border">
                  Ihre Vorteile
                </Heading>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-action" />
                    </div>
                    <div>
                      <div className="font-semibold text-text-primary">Geprüfte Qualität</div>
                      <div className="text-sm text-text-secondary">Jedes Gerät wird getestet</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                      <Leaf className="w-5 h-5 text-action" />
                    </div>
                    <div>
                      <div className="font-semibold text-text-primary">Nachhaltig</div>
                      <div className="text-sm text-text-secondary">IT ein zweites Leben geben</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="w-48 shrink-0 text-center">
                <div className="bg-surface-base border-2 border rounded-xl p-3 inline-block">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code zum Online-Shop"
                    className="w-32 h-32 mx-auto"
                  />
                </div>
                <div className="mt-2 flex items-center justify-center gap-1 text-text-secondary text-sm">
                  <Smartphone className="w-4 h-4" />
                  Online ansehen & kaufen
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="mt-auto px-8 py-4 bg-surface-raised border-t border">
            <div className="flex items-center justify-between text-sm">
              <div className="text-text-secondary">
                <span className="font-medium">{ORG.name}</span> | {ORG.legalForm}
              </div>
              <div className="text-text-tertiary">
                {ORG.emailDomain} | {LOCATIONS.store.city}
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
            box-shadow: ${PRINT_PREVIEW_SHADOW};
          }
        }
      `}</style>
    </>
  )
}
