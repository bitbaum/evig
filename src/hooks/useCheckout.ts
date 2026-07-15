'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { COMMISSION_RATE } from '@/config/marketplace'
import { useShippingAddress, type ShippingAddress } from '@/hooks/useShippingAddress'

export type { ShippingAddress }

export interface ListingForCheckout {
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
  is_revampit: boolean
}

interface CheckoutErrors {
  orderError: string
  networkError: string
}

export function useCheckout(
  initialListing: ListingForCheckout,
  errors: CheckoutErrors,
) {
  const [listing] = useState(initialListing)
  const [error, setError] = useState<string | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'shipping'>(() =>
    initialListing.delivery_options === 'shipping' ? 'shipping' : 'pickup',
  )
  // Shared address state — prefilled from the buyer's saved profile address
  // and optionally written back on order creation (see useShippingAddress).
  const {
    shippingAddress,
    setShippingAddress,
    prefilled: addressPrefilled,
    postalCodeValid,
    addressComplete,
    canOfferSave,
    saveToProfile,
    setSaveToProfile,
    persistAddressIfRequested,
  } = useShippingAddress()
  const [creatingOrder, setCreatingOrder] = useState(false)

  const handleCreateOrder = async () => {
    if (creatingOrder) return
    setCreatingOrder(true)
    setError(null)

    try {
      if (deliveryMethod === 'shipping') {
        await persistAddressIfRequested()
      }
      const result = await apiFetch<{ paymentUrl?: string }>('/api/marketplace/orders', {
        method: 'POST',
        body: {
          listing_id: listing.id,
          delivery_method: deliveryMethod,
          shipping_address: deliveryMethod === 'shipping' ? shippingAddress : null,
        },
      })

      if (result.success && result.data?.paymentUrl) {
        window.location.href = result.data.paymentUrl
      } else {
        setError(result.error || errors.orderError)
        setCreatingOrder(false)
      }
    } catch (err) {
      logger.warn('Failed to create checkout order', { error: err })
      setError(errors.networkError)
      setCreatingOrder(false)
    }
  }

  const shippingCost = deliveryMethod === 'shipping' && listing.shipping_cost_chf
    ? listing.shipping_cost_chf : 0
  const totalAmount = listing.price_chf + shippingCost
  const commission = Math.round(totalAmount * COMMISSION_RATE * 100) / 100
  const canSelectDelivery = listing.delivery_options === 'both'
  const shippingFormValid = deliveryMethod !== 'shipping' || addressComplete

  return {
    listing,
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
    addressPrefilled,
    canOfferSave,
    saveToProfile,
    setSaveToProfile,
    setDeliveryMethod,
    setShippingAddress,
    handleCreateOrder,
  }
}
