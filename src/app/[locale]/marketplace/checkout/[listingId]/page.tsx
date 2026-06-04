'use client'

import { Link } from '@/i18n/navigation'
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
import { Input } from '@/components/ui/input'
import { formatCHF, COMMISSION_RATE } from '@/config/marketplace'
import { useTranslations } from 'next-intl'
import { useCheckout } from '@/hooks/useCheckout'
import { ROUTES } from '@/config/routes'

export default function CheckoutPage({ params }: { params: Promise<{ listingId: string }> }) {
  const t = useTranslations('marketplace.checkout')

  const {
    session,
    sessionStatus,
    listing,
    isLoading,
    error,
    deliveryMethod,
    shippingAddress,
    creatingOrder,
    shippingCost,
    totalAmount,
    commission,
    canSelectDelivery,
    postalCodeValid,
    shippingFormValid,
    setDeliveryMethod,
    setShippingAddress,
    handleCreateOrder,
  } = useCheckout(params, {
    notFound: t('notFound'),
    loadError: t('loadError'),
    orderError: t('orderError'),
    networkError: t('networkError'),
  })

  if (isLoading || sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-action animate-spin" />
        <span className="ml-3 text-text-secondary">{t('loading')}</span>
      </div>
    )
  }

  if (error && !listing) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <Heading level={2} className="text-xl text-text-primary mb-2">{error}</Heading>
        <Link href={ROUTES.public.marketplace} className="text-action hover:text-primary-700 font-medium">
          {t('backToMarketplace')}
        </Link>
      </div>
    )
  }

  if (!listing) return null

  if (session?.user?.id === listing.seller_id) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-16 h-16 text-warning-400 mx-auto mb-4" />
        <Heading level={2} className="text-xl text-text-primary mb-2">
          {t('ownListing')}
        </Heading>
        <p className="text-text-secondary mb-4">
          {t('ownListingDesc')}
        </p>
        <Link href={ROUTES.public.marketplaceListing(listing.id)} className="text-action hover:text-primary-700 font-medium">
          {t('backToListing')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={ROUTES.public.marketplaceListing(listing.id)}
        className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToListing')}
      </Link>

      <Heading level={1} className="text-2xl text-text-primary mb-6">{t('title')}</Heading>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-3 space-y-6">
          {canSelectDelivery && (
            <div className="card-shell p-6">
              <Heading level={2} className="text-lg text-text-primary mb-4">{t('delivery.title')}</Heading>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  deliveryMethod === 'pickup'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border dark:border-neutral-700 hover:border-neutral-300'
                }`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="pickup"
                    checked={deliveryMethod === 'pickup'}
                    onChange={() => setDeliveryMethod('pickup')}
                    className="text-action focus:ring-primary-500"
                  />
                  <MapPin className="w-5 h-5 text-text-tertiary" />
                  <div>
                    <p className="font-medium text-text-primary">{t('delivery.pickup')}</p>
                    {listing.pickup_location && (
                      <p className="text-sm text-text-tertiary">{listing.pickup_location}</p>
                    )}
                  </div>
                  <span className="ml-auto font-medium text-action">{t('delivery.free')}</span>
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  deliveryMethod === 'shipping'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border dark:border-neutral-700 hover:border-neutral-300'
                }`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="shipping"
                    checked={deliveryMethod === 'shipping'}
                    onChange={() => setDeliveryMethod('shipping')}
                    className="text-action focus:ring-primary-500"
                  />
                  <Truck className="w-5 h-5 text-text-tertiary" />
                  <div>
                    <p className="font-medium text-text-primary">{t('delivery.shipping')}</p>
                    <p className="text-sm text-text-tertiary">{t('delivery.shippingNationwide')}</p>
                  </div>
                  <span className="ml-auto font-medium text-text-primary">
                    {listing.shipping_cost_chf ? formatCHF(listing.shipping_cost_chf) : t('delivery.free')}
                  </span>
                </label>
              </div>
            </div>
          )}

          {deliveryMethod === 'shipping' && (
            <div className="card-shell p-6">
              <Heading level={2} className="text-lg text-text-primary mb-4">{t('address.title')}</Heading>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{t('address.name')}</label>
                  <Input
                    type="text"
                    value={shippingAddress.name}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('address.namePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{t('address.street')}</label>
                  <Input
                    type="text"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                    placeholder={t('address.streetPlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">{t('address.postalCode')}</label>
                    <Input
                      type="text"
                      value={shippingAddress.postal_code}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                      maxLength={4}
                      className={shippingAddress.postal_code && !postalCodeValid ? 'border-error-500' : ''}
                      placeholder="8000"
                    />
                    {shippingAddress.postal_code && !postalCodeValid && (
                      <p className="text-xs text-error-500 mt-1">{t('address.postalCodeError')}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">{t('address.city')}</label>
                    <Input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      placeholder={t('address.cityPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4 text-error-700 dark:text-error-300">
              {error}
            </div>
          )}

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
          <div className="card-shell p-6 sticky top-6">
            <Heading level={2} className="text-lg text-text-primary mb-4">{t('summary.title')}</Heading>

            <div className="flex gap-3 mb-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-raised dark:bg-neutral-700">
                <ListingImage src={listing.thumbnail} alt={listing.title} fallbackIconSize="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <Heading level={3} className="text-text-primary text-sm line-clamp-2">{listing.title}</Heading>
                <p className="text-xs text-text-tertiary mt-1">
                  {t('summary.seller', { name: listing.seller_name })}
                </p>
              </div>
            </div>

            <hr className="border dark:border-neutral-700 mb-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-tertiary">{t('summary.itemPrice')}</span>
                <span className="text-text-primary">{formatCHF(listing.price_chf)}</span>
              </div>
              {deliveryMethod === 'shipping' && shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-tertiary">{t('summary.shippingCost')}</span>
                  <span className="text-text-primary">{formatCHF(shippingCost)}</span>
                </div>
              )}
              {deliveryMethod === 'pickup' && (
                <div className="flex justify-between">
                  <span className="text-text-tertiary">{t('summary.pickup')}</span>
                  <span className="text-action">{t('delivery.free')}</span>
                </div>
              )}
              {!listing.is_revampit && (
                <div className="flex justify-between text-xs text-text-muted">
                  <span>{t('summary.serviceFee', { rate: COMMISSION_RATE * 100 })}</span>
                  <span>{t('summary.serviceIncl', { amount: formatCHF(commission) })}</span>
                </div>
              )}
            </div>

            <hr className="border dark:border-neutral-700 my-4" />

            <div className="flex justify-between text-lg font-bold">
              <span className="text-text-primary">{t('summary.total')}</span>
              <span className="text-action">{formatCHF(totalAmount)}</span>
            </div>

            <div className="mt-4 p-3 bg-surface-raised dark:bg-neutral-700/50 rounded-lg text-xs text-text-tertiary">
              <p className="flex items-center gap-1.5">
                {deliveryMethod === 'shipping' ? (
                  <><Truck className="w-3.5 h-3.5" /> {t('summary.shipping')}</>
                ) : (
                  <><MapPin className="w-3.5 h-3.5" /> {listing.pickup_location || t('summary.pickup')}</>
                )}
              </p>
            </div>

            <div className="mt-4 space-y-2 text-xs text-text-tertiary">
              <p className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-action" />
                {t('buyerProtection')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
