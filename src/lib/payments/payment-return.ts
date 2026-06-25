/**
 * Payrexx return URL query params — shared across checkout surfaces.
 */

export const PAYMENT_RETURN_PARAM = 'payment' as const
export const PAYMENT_ERROR_PARAM = 'error' as const

export type PaymentReturnState = 'success' | 'failed' | 'cancelled'

export function parsePaymentReturn(
  value: string | null | undefined,
): PaymentReturnState | null {
  if (value === 'success' || value === 'failed' || value === 'cancelled') {
    return value
  }
  return null
}

export function parsePaymentError(
  value: string | null | undefined,
): 'payment_failed' | 'payment_cancelled' | null {
  if (value === 'payment_failed' || value === 'payment_cancelled') {
    return value
  }
  return null
}

/** Normalise marketplace `error` param to payment return state. */
export function paymentErrorToReturnState(
  error: string | null | undefined,
): PaymentReturnState | null {
  if (error === 'payment_failed') return 'failed'
  if (error === 'payment_cancelled') return 'cancelled'
  return null
}
