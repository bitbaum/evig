'use client'

/**
 * useShippingAddress — SSOT for the checkout shipping-address form.
 *
 * Used by BOTH checkout flows (single-item /marketplace/checkout/[listingId]
 * and the RevampIT cart). Owns the address state, prefills it once from the
 * logged-in user's saved profile address (user_profiles), validates it, and
 * optionally writes it back to the profile ("für das nächste Mal speichern")
 * when an order is placed — so returning buyers never retype their address.
 */

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'

export interface ShippingAddress {
  name: string
  street: string
  city: string
  postal_code: string
  country: string
}

interface ProfileAddressResponse {
  profile?: {
    first_name?: string | null
    last_name?: string | null
    address_line1?: string | null
    postal_code?: string | null
    city?: string | null
  }
}

export const EMPTY_SHIPPING_ADDRESS: ShippingAddress = {
  name: '',
  street: '',
  city: '',
  postal_code: '',
  country: 'CH',
}

function isUntouched(address: ShippingAddress): boolean {
  return !address.name && !address.street && !address.city && !address.postal_code
}

export function useShippingAddress() {
  const { data: session, status } = useSession()
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(EMPTY_SHIPPING_ADDRESS)
  const [prefilled, setPrefilled] = useState(false)
  const [saveToProfile, setSaveToProfile] = useState(false)
  // The profile address as loaded, to know whether saving back is meaningful.
  // State (not a ref) — it's read during render to compute canOfferSave.
  const [loadedProfileAddress, setLoadedProfileAddress] = useState<
    { street: string; postal_code: string; city: string } | null
  >(null)
  const attemptedPrefill = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated' || attemptedPrefill.current) return
    attemptedPrefill.current = true
    let cancelled = false
    async function prefill() {
      const result = await apiFetch<ProfileAddressResponse>('/api/user/profile')
      if (cancelled || !result.success || !result.data?.profile) return
      const p = result.data.profile
      setLoadedProfileAddress({
        street: p.address_line1 ?? '',
        postal_code: p.postal_code ?? '',
        city: p.city ?? '',
      })
      const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ')
        || session?.user?.name
        || ''
      if (!p.address_line1 || !p.postal_code || !p.city) return
      setShippingAddress(prev => {
        // Never overwrite anything the user already typed.
        if (!isUntouched(prev)) return prev
        setPrefilled(true)
        return {
          name: fullName,
          street: p.address_line1 ?? '',
          city: p.city ?? '',
          postal_code: p.postal_code ?? '',
          country: 'CH',
        }
      })
    }
    void prefill()
    return () => { cancelled = true }
  }, [status, session?.user?.name])

  const postalCodeValid = /^\d{4}$/.test(shippingAddress.postal_code)
  const addressComplete =
    shippingAddress.name.trim() !== '' &&
    shippingAddress.street.trim() !== '' &&
    shippingAddress.city.trim() !== '' &&
    postalCodeValid

  // Whether offering "save to profile" makes sense: logged in, and the typed
  // address differs from what the profile already has.
  const addressDiffersFromProfile =
    shippingAddress.street.trim() !== (loadedProfileAddress?.street ?? '').trim() ||
    shippingAddress.postal_code !== (loadedProfileAddress?.postal_code ?? '') ||
    shippingAddress.city.trim() !== (loadedProfileAddress?.city ?? '').trim()
  const canOfferSave = status === 'authenticated' && addressDiffersFromProfile

  /**
   * Persist the address to the user's profile if the user opted in.
   * Fire-and-forget semantics: a failed save must never block the order.
   */
  const persistAddressIfRequested = async () => {
    if (!saveToProfile || !canOfferSave || !addressComplete) return
    const result = await apiFetch<void>('/api/user/profile', {
      method: 'PUT',
      body: {
        address_line1: shippingAddress.street.trim(),
        postal_code: shippingAddress.postal_code,
        city: shippingAddress.city.trim(),
      },
    })
    if (!result.success) {
      logger.warn('Saving checkout address to profile failed', { error: result.error })
    }
  }

  return {
    shippingAddress,
    setShippingAddress,
    prefilled,
    postalCodeValid,
    addressComplete,
    canOfferSave,
    saveToProfile,
    setSaveToProfile,
    persistAddressIfRequested,
  }
}
