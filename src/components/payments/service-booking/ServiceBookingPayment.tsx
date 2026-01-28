'use client'

/**
 * Service Booking Payment Component
 *
 * Main orchestrating component for service booking with payment.
 * Uses extracted sub-components for each step of the flow.
 */

import { useServiceBooking } from './useServiceBooking'
import { SuccessView } from './SuccessView'
import { ErrorView } from './ErrorView'
import { PaymentView } from './PaymentView'
import { ProcessingView } from './ProcessingView'
import { BookingForm } from './BookingForm'
import type { ServiceBookingPaymentProps } from './types'

export default function ServiceBookingPayment({
  service,
  onSuccess,
  onError,
}: ServiceBookingPaymentProps) {
  const {
    step,
    selectedCurrency,
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
  } = useServiceBooking({ service, onSuccess, onError })

  if (step === 'success') {
    return (
      <SuccessView
        service={service}
        paymentData={paymentData}
        useEscrow={bookingData.useEscrow}
      />
    )
  }

  if (step === 'error') {
    return (
      <ErrorView
        error={error}
        onRetry={() => setStep('details')}
      />
    )
  }

  if (step === 'payment' && paymentData) {
    return (
      <PaymentView
        service={service}
        paymentData={paymentData}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    )
  }

  if (step === 'processing') {
    return <ProcessingView />
  }

  // Default: details step
  return (
    <BookingForm
      service={service}
      bookingData={bookingData}
      selectedCurrency={selectedCurrency}
      currentPricing={currentPricing}
      onBookingDataChange={setBookingData}
      onCurrencyChange={handleCurrencyChange}
      onSubmit={handleBookingSubmit}
    />
  )
}
