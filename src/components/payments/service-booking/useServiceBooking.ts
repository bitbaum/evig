/**
 * Hook for service booking state and handlers
 */

import { useState, useMemo } from 'react'
import type { PaymentResult } from '@/types/common'
import type {
  BookingStep,
  BookingData,
  PaymentData,
  DisplayPricing,
  ServiceInfo,
  PaymentSuccessResult,
  SupportedCurrency,
  ServicePricing,
} from './types'

interface UseServiceBookingProps {
  service: ServiceInfo
  onSuccess?: (result: PaymentSuccessResult) => void
  onError?: (error: string) => void
}

interface UseServiceBookingReturn {
  // State
  step: BookingStep
  selectedCurrency: SupportedCurrency
  currencyPricing: ServicePricing | null
  bookingData: BookingData
  paymentData: PaymentData | null
  error: string
  currentPricing: DisplayPricing

  // Actions
  setStep: (step: BookingStep) => void
  setBookingData: React.Dispatch<React.SetStateAction<BookingData>>
  handleCurrencyChange: (currency: SupportedCurrency, pricing: ServicePricing) => void
  handleBookingSubmit: () => Promise<void>
  handlePaymentSuccess: (paymentIntent: PaymentResult) => Promise<void>
  handlePaymentError: (error: string) => void
}

const INITIAL_BOOKING_DATA: BookingData = {
  description: '',
  urgency: 'normal',
  deviceInfo: '',
  useEscrow: true,
  preferredDate: '',
  preferredTimeSlots: [],
}

export function useServiceBooking({
  service,
  onSuccess,
  onError,
}: UseServiceBookingProps): UseServiceBookingReturn {
  const [step, setStep] = useState<BookingStep>('details')
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('CHF')
  const [currencyPricing, setCurrencyPricing] = useState<ServicePricing | null>(null)
  const [bookingData, setBookingData] = useState<BookingData>(INITIAL_BOOKING_DATA)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [error, setError] = useState<string>('')

  const servicePrice = service.price_cents / 100

  const currentPricing: DisplayPricing = useMemo(() => {
    if (currencyPricing) {
      return {
        subtotal: currencyPricing.convertedPrice,
        vat: currencyPricing.vat,
        total: currencyPricing.total,
      }
    }
    return {
      subtotal: servicePrice,
      vat: servicePrice * 0.077, // Swiss VAT
      total: servicePrice * 1.077 + Math.round(servicePrice * 0.029) + 0.30,
    }
  }, [currencyPricing, servicePrice])

  const handleCurrencyChange = (currency: SupportedCurrency, pricing: ServicePricing) => {
    setSelectedCurrency(currency)
    setCurrencyPricing(pricing)
  }

  const handleBookingSubmit = async () => {
    setStep('processing')
    setError('')

    try {
      const response = await fetch('/api/appointments/book-with-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceSlug: service.slug,
          ...bookingData,
          currency: selectedCurrency,
          amount: currentPricing.total,
          includeVAT: true,
          businessType: 'service',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Booking failed')
      }

      setPaymentData({
        clientSecret: result.clientSecret,
        amount: result.amount,
        appointmentId: result.appointmentId,
        invoiceId: result.invoiceId,
        invoiceNumber: result.invoiceNumber,
        pricing: result.pricing,
      })

      setStep('payment')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      setError(message)
      setStep('error')
      onError?.(message)
    }
  }

  const handlePaymentSuccess = async (paymentIntent: PaymentResult) => {
    setStep('processing')

    try {
      setStep('success')
      if (paymentData) {
        onSuccess?.({
          appointmentId: paymentData.appointmentId,
          invoiceId: paymentData.invoiceId,
          paymentIntentId: paymentIntent.id,
          invoiceNumber: paymentData.invoiceNumber,
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      setError('Payment succeeded but booking confirmation failed')
      setStep('error')
      onError?.(message)
    }
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
    setStep('error')
    onError?.(errorMessage)
  }

  return {
    step,
    selectedCurrency,
    currencyPricing,
    bookingData,
    paymentData,
    error,
    currentPricing,
    setStep,
    setBookingData,
    handleCurrencyChange,
    handleBookingSubmit,
    handlePaymentSuccess,
    handlePaymentError,
  }
}
