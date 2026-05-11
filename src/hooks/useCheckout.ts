'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
}

export interface ShippingAddress {
  name: string
  street: string
  city: string
  postal_code: string
  country: string
}

interface CheckoutErrors {
  notFound: string
  loadError: string
  orderError: string
  networkError: string
}

export function useCheckout(params: Promise<{ listingId: string }>, errors: CheckoutErrors) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [listing, setListing] = useState<ListingForCheckout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'shipping'>('pickup')
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
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
    if (sessionStatus !== 'authenticated') return

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
          const mapped: ListingForCheckout = {
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
          }
          setListing(mapped)
          setDeliveryMethod(l.delivery_options === 'shipping' ? 'shipping' : 'pickup')
        } else {
          setError(result.error || errors.notFound)
        }
      } catch (err) {
        logger.warn('Failed to load checkout listing', { error: err })
        setError(errors.loadError)
      } finally {
        setIsLoading(false)
      }
    }
    fetchListing()
  }, [params, sessionStatus, router, errors.notFound, errors.loadError])

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

  const shippingCost = deliveryMethod === 'shipping' && listing?.shipping_cost_chf
    ? listing.shipping_cost_chf : 0
  const totalAmount = (listing?.price_chf ?? 0) + shippingCost
  const commission = Math.round(totalAmount * COMMISSION_RATE * 100) / 100
  const canSelectDelivery = listing?.delivery_options === 'both'
  const postalCodeValid = /^\d{4}$/.test(shippingAddress.postal_code)
  const shippingFormValid = deliveryMethod !== 'shipping' || (
    shippingAddress.name.trim() !== '' &&
    shippingAddress.street.trim() !== '' &&
    shippingAddress.city.trim() !== '' &&
    postalCodeValid
  )

  return {
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
  }
}
