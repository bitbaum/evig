'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { COMMISSION_RATE } from '@/config/marketplace'

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

export interface ShippingAddress {
  name: string
  street: string
  city: string
  postal_code: string
  country: string
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
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    street: '',
    city: '',
    postal_code: '',
    country: 'CH',
  })
  const [creatingOrder, setCreatingOrder] = useState(false)

  const handleCreateOrder = async () => {
    if (creatingOrder) return
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
  const postalCodeValid = /^\d{4}$/.test(shippingAddress.postal_code)
  const shippingFormValid = deliveryMethod !== 'shipping' || (
    shippingAddress.name.trim() !== '' &&
    shippingAddress.street.trim() !== '' &&
    shippingAddress.city.trim() !== '' &&
    postalCodeValid
  )

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
    setDeliveryMethod,
    setShippingAddress,
    handleCreateOrder,
  }
}
