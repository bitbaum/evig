'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  PAYMENT_ERROR_PARAM,
  PAYMENT_RETURN_PARAM,
  parsePaymentError,
  parsePaymentReturn,
  paymentErrorToReturnState,
  type PaymentReturnState,
} from '@/lib/payments/payment-return'

interface Options {
  /** Strip query params after reading (default true). */
  cleanUrl?: boolean
  /** URL to replace after cleaning (defaults to current pathname). */
  cleanPath?: string
}

/**
 * Read Payrexx return state from `?payment=` or marketplace `?error=` and
 * optionally strip it from the URL so refresh doesn't re-show the banner.
 */
export function usePaymentReturnBanner(options: Options = {}) {
  const { cleanUrl = true, cleanPath } = options
  const searchParams = useSearchParams()
  const router = useRouter()

  const [banner, setBanner] = useState<PaymentReturnState | null>(() => {
    const fromPayment = parsePaymentReturn(searchParams.get(PAYMENT_RETURN_PARAM))
    if (fromPayment) return fromPayment
    const fromError = paymentErrorToReturnState(parsePaymentError(searchParams.get(PAYMENT_ERROR_PARAM)))
    return fromError
  })

  useEffect(() => {
    const fromPayment = parsePaymentReturn(searchParams.get(PAYMENT_RETURN_PARAM))
    const fromError = paymentErrorToReturnState(parsePaymentError(searchParams.get(PAYMENT_ERROR_PARAM)))
    const state = fromPayment ?? fromError

    if (!cleanUrl || !state) return

    const path = cleanPath ?? window.location.pathname
    router.replace(path)
  }, [searchParams, router, cleanUrl, cleanPath])

  const dismiss = () => setBanner(null)

  return { banner, dismiss, isSuccess: banner === 'success', isFailed: banner === 'failed', isCancelled: banner === 'cancelled' }
}
