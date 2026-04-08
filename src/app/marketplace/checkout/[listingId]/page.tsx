'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Truck,
  MapPin,
  Shield,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { ListingImage } from '@/components/marketplace/ListingImage'
import { formatCHF, COMMISSION_RATE, DELIVERY_LABELS } from '@/config/marketplace'
import type { DeliveryOption } from '@/config/marketplace'

interface ListingForCheckout {
  id: string
  title: string
  price_chf: number
  delivery_options: string
  shipping_cost_chf: number | null
  payment_mode: string
  pickup_location: string | null
  thumbnail: string | null
  seller_name: string
  seller_id: string
}

export default function CheckoutPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [listing, setListing] = useState<ListingForCheckout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'shipping'>('pickup')
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    street: '',
    city: '',
    postal_code: '',
    country: 'CH',
  })
  const [creatingOrder, setCreatingOrder] = useState(false)

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    const fetchListing = async () => {
      try {
        const { listingId } = await params
        const response = await fetch(`/api/listings/${listingId}`)
        const data = await response.json()

        if (data.success && data.data) {
          const l = data.data
          setListing({
            id: l.id,
            title: l.title,
            price_chf: Number(l.price_chf),
            delivery_options: l.delivery_options,
            shipping_cost_chf: l.shipping_cost_chf ? Number(l.shipping_cost_chf) : null,
            payment_mode: l.payment_mode,
            pickup_location: l.pickup_location,
            thumbnail: l.images?.[0]?.url || null,
            seller_name: l.seller_display_name || l.seller_name,
            seller_id: l.seller_id,
          })
          // Set default delivery method
          if (l.delivery_options === 'shipping') setDeliveryMethod('shipping')
          else setDeliveryMethod('pickup')
        } else {
          setError(data.error || 'Inserat nicht gefunden')
        }
      } catch {
        setError('Fehler beim Laden des Inserats')
      } finally {
        setIsLoading(false)
      }
    }
    fetchListing()
  }, [params, sessionStatus, router])

  const handleCreateOrder = async () => {
    if (!listing || creatingOrder) return
    setCreatingOrder(true)
    setError(null)

    try {
      const response = await fetch('/api/marketplace/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.id,
          delivery_method: deliveryMethod,
          shipping_address: deliveryMethod === 'shipping' ? shippingAddress : null,
        }),
      })

      const data = await response.json()

      if (data.success && data.data?.paymentUrl) {
        // Redirect to Payrexx hosted payment page
        window.location.href = data.data.paymentUrl
      } else {
        setError(data.error || 'Bestellung konnte nicht erstellt werden')
        setCreatingOrder(false)
      }
    } catch {
      setError('Netzwerkfehler beim Erstellen der Bestellung')
      setCreatingOrder(false)
    }
  }

  if (isLoading || sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Wird geladen...</span>
      </div>
    )
  }

  if (error && !listing) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{error}</h2>
        <Link href="/marketplace" className="text-green-600 hover:text-green-700 font-medium">
          Zurück zum Marketplace
        </Link>
      </div>
    )
  }

  if (!listing) return null

  // Guard: prevent self-purchase
  const isOwnListing = session?.user?.id === listing.seller_id
  if (isOwnListing) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Eigenes Inserat
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          du kannst Ihr eigenes Inserat nicht kaufen.
        </p>
        <Link href={`/marketplace/${listing.id}`} className="text-green-600 hover:text-green-700 font-medium">
          Zurück zum Inserat
        </Link>
      </div>
    )
  }

  const shippingCost = deliveryMethod === 'shipping' && listing.shipping_cost_chf
    ? listing.shipping_cost_chf : 0
  const totalAmount = listing.price_chf + shippingCost
  const commission = Math.round(totalAmount * COMMISSION_RATE * 100) / 100
  const canSelectDelivery = listing.delivery_options === 'both'
  const postalCodeValid = /^\d{4}$/.test(shippingAddress.postal_code)
  const shippingFormValid = deliveryMethod !== 'shipping' || (
    shippingAddress.name.trim() &&
    shippingAddress.street.trim() &&
    shippingAddress.city.trim() &&
    postalCodeValid
  )

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/marketplace/${listing.id}`}
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zum Inserat
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Sichere Zahlung</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Delivery method selection */}
          {canSelectDelivery && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lieferart wählen</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  deliveryMethod === 'pickup'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="pickup"
                    checked={deliveryMethod === 'pickup'}
                    onChange={() => setDeliveryMethod('pickup')}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Abholung</p>
                    {listing.pickup_location && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{listing.pickup_location}</p>
                    )}
                  </div>
                  <span className="ml-auto font-medium text-green-600">Kostenlos</span>
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  deliveryMethod === 'shipping'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="shipping"
                    checked={deliveryMethod === 'shipping'}
                    onChange={() => setDeliveryMethod('shipping')}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <Truck className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Versand</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Schweizweit</p>
                  </div>
                  <span className="ml-auto font-medium text-gray-900 dark:text-white">
                    {listing.shipping_cost_chf ? formatCHF(listing.shipping_cost_chf) : 'Kostenlos'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Shipping address form */}
          {deliveryMethod === 'shipping' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lieferadresse</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={shippingAddress.name}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Max Muster"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Strasse</label>
                  <input
                    type="text"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Musterstrasse 1"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PLZ</label>
                    <input
                      type="text"
                      value={shippingAddress.postal_code}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                      maxLength={4}
                      className={`w-full rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        shippingAddress.postal_code && !postalCodeValid
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="8000"
                    />
                    {shippingAddress.postal_code && !postalCodeValid && (
                      <p className="text-xs text-red-500 mt-1">PLZ muss 4 Ziffern haben</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ort</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Zürich"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Proceed button */}
          <Button
            onClick={handleCreateOrder}
            disabled={creatingOrder || !shippingFormValid}
            className="w-full gap-2 py-3 px-6 font-semibold text-lg"
          >
            {creatingOrder ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Weiterleitung zur Zahlung...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Weiter zur Zahlung
              </>
            )}
          </Button>
        </div>

        {/* Right: Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bestellübersicht</h2>

            {/* Listing preview */}
            <div className="flex gap-3 mb-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                <ListingImage src={listing.thumbnail} alt={listing.title} fallbackIconSize="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">{listing.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Verkäufer: {listing.seller_name}
                </p>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700 mb-4" />

            {/* Price breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Artikelpreis</span>
                <span className="text-gray-900 dark:text-white">{formatCHF(listing.price_chf)}</span>
              </div>
              {deliveryMethod === 'shipping' && shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Versandkosten</span>
                  <span className="text-gray-900 dark:text-white">{formatCHF(shippingCost)}</span>
                </div>
              )}
              {deliveryMethod === 'pickup' && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Abholung</span>
                  <span className="text-green-600">Kostenlos</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>Servicegebühr ({COMMISSION_RATE * 100}%)</span>
                <span>inkl. {formatCHF(commission)}</span>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700 my-4" />

            <div className="flex justify-between text-lg font-bold">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-green-600">{formatCHF(totalAmount)}</span>
            </div>

            {/* Delivery info */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs text-gray-500 dark:text-gray-400">
              <p className="flex items-center gap-1.5">
                {deliveryMethod === 'shipping' ? (
                  <><Truck className="w-3.5 h-3.5" /> Versand</>
                ) : (
                  <><MapPin className="w-3.5 h-3.5" /> {listing.pickup_location || 'Abholung'}</>
                )}
              </p>
            </div>

            {/* Trust badges */}
            <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <p className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-green-600" />
                Käuferschutz — Zahlung wird erst nach Empfangsbestätigung freigegeben
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
