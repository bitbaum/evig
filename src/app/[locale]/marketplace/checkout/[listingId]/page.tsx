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
import Heading from '@/components/ui/Heading'
import { formatCHF, COMMISSION_RATE } from '@/config/marketplace'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'

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
  const t = useTranslations('marketplace.checkout')
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
        const result = await apiFetch<{
          id: string
          title: string
          price_chf: number | string
          delivery_options: string
          shipping_cost_chf: number | string | null
          payment_mode: string
          pickup_location: string | null
          images?: Array<{ url: string }>
          seller_name: string
          seller_display_name: string | null
          seller_id: string
        }>(`/api/listings/${listingId}`)

        if (result.success && result.data) {
          const l = result.data
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
          setError(result.error || t('notFound'))
        }
      } catch (err) {
        logger.warn('Failed to load checkout listing', { error: err })
        setError(t('loadError'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchListing()
  }, [params, sessionStatus, router, t])

  const handleCreateOrder = async () => {
    if (!listing || creatingOrder) return
    setCreatingOrder(true)
    setError(null)

    try {
      const result = await apiFetch<{ paymentUrl?: string }>('/api/marketplace/orders', {
        method: 'POST',
        body: {
          listing_id: listing.id,
          delivery_method: deliveryMethod,
          shipping_address: deliveryMethod === 'shipping' ? shippingAddress : null,
        },
      })

      if (result.success && result.data?.paymentUrl) {
        // Redirect to Payrexx hosted payment page
        window.location.href = result.data.paymentUrl
      } else {
        setError(result.error || t('orderError'))
        setCreatingOrder(false)
      }
    } catch (err) {
      logger.warn('Failed to create checkout order', { error: err })
      setError(t('networkError'))
      setCreatingOrder(false)
    }
  }

  if (isLoading || sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">{t('loading')}</span>
      </div>
    )
  }

  if (error && !listing) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <Heading level={2} className="text-xl text-gray-900 dark:text-white mb-2">{error}</Heading>
        <Link href="/marketplace" className="text-green-600 hover:text-green-700 font-medium">
          {t('backToMarketplace')}
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
        <Heading level={2} className="text-xl text-gray-900 dark:text-white mb-2">
          {t('ownListing.title')}
        </Heading>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('ownListing.message')}
        </p>
        <Link href={`/marketplace/${listing.id}`} className="text-green-600 hover:text-green-700 font-medium">
          {t('backToListing')}
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
        {t('backToListing')}
      </Link>

      <Heading level={1} className="text-2xl text-gray-900 dark:text-white mb-6">{t('title')}</Heading>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Delivery method selection */}
          {canSelectDelivery && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <Heading level={2} className="text-lg text-gray-900 dark:text-white mb-4">{t('delivery.title')}</Heading>
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
                    <p className="font-medium text-gray-900 dark:text-white">{t('delivery.pickup')}</p>
                    {listing.pickup_location && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{listing.pickup_location}</p>
                    )}
                  </div>
                  <span className="ml-auto font-medium text-green-600">{t('delivery.free')}</span>
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
                    <p className="font-medium text-gray-900 dark:text-white">{t('delivery.shipping')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('delivery.shippingNationwide')}</p>
                  </div>
                  <span className="ml-auto font-medium text-gray-900 dark:text-white">
                    {listing.shipping_cost_chf ? formatCHF(listing.shipping_cost_chf) : t('delivery.free')}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Shipping address form */}
          {deliveryMethod === 'shipping' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <Heading level={2} className="text-lg text-gray-900 dark:text-white mb-4">{t('address.title')}</Heading>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('address.name')}</label>
                  <input
                    type="text"
                    value={shippingAddress.name}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t('address.namePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('address.street')}</label>
                  <input
                    type="text"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t('address.streetPlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('address.postalCode')}</label>
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
                      <p className="text-xs text-red-500 mt-1">{t('address.postalCodeError')}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('address.city')}</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={t('address.cityPlaceholder')}
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
                {t('payment.redirect')}
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                {t('payment.proceed')}
              </>
            )}
          </Button>
        </div>

        {/* Right: Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm sticky top-6">
            <Heading level={2} className="text-lg text-gray-900 dark:text-white mb-4">{t('summary.title')}</Heading>

            {/* Listing preview */}
            <div className="flex gap-3 mb-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                <ListingImage src={listing.thumbnail} alt={listing.title} fallbackIconSize="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <Heading level={3} className="text-gray-900 dark:text-white text-sm line-clamp-2">{listing.title}</Heading>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('summary.seller', { name: listing.seller_name })}
                </p>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700 mb-4" />

            {/* Price breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('summary.itemPrice')}</span>
                <span className="text-gray-900 dark:text-white">{formatCHF(listing.price_chf)}</span>
              </div>
              {deliveryMethod === 'shipping' && shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('summary.shippingCost')}</span>
                  <span className="text-gray-900 dark:text-white">{formatCHF(shippingCost)}</span>
                </div>
              )}
              {deliveryMethod === 'pickup' && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('summary.pickup')}</span>
                  <span className="text-green-600">{t('delivery.free')}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>{t('summary.serviceFee', { rate: COMMISSION_RATE * 100 })}</span>
                <span>{t('summary.serviceIncl', { amount: formatCHF(commission) })}</span>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700 my-4" />

            <div className="flex justify-between text-lg font-bold">
              <span className="text-gray-900 dark:text-white">{t('summary.total')}</span>
              <span className="text-green-600">{formatCHF(totalAmount)}</span>
            </div>

            {/* Delivery info */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs text-gray-500 dark:text-gray-400">
              <p className="flex items-center gap-1.5">
                {deliveryMethod === 'shipping' ? (
                  <><Truck className="w-3.5 h-3.5" /> {t('summary.shipping')}</>
                ) : (
                  <><MapPin className="w-3.5 h-3.5" /> {listing.pickup_location || t('summary.pickup')}</>
                )}
              </p>
            </div>

            {/* Trust badges */}
            <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <p className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-green-600" />
                {t('buyerProtection')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
