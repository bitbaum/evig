/**
 * Service Booking Payment - barrel export.
 *
 * @deprecated Orphaned — zero importers in src/. Tracked in
 *   docs/DEAD_CODE.md for a future bulk-cleanup PR. Do NOT add a new
 *   import without removing the deprecation marker and updating
 *   DEAD_CODE.md to reflect the renewed use.
 */

export { default as ServiceBookingPayment } from './ServiceBookingPayment'
export { SuccessView } from './SuccessView'
export { ErrorView } from './ErrorView'
export { PaymentView } from './PaymentView'
export { ProcessingView } from './ProcessingView'
export { BookingForm } from './BookingForm'
export { useServiceBooking } from './useServiceBooking'

// Types
export type {
  BookingStep,
  UrgencyLevel,
  ApiPricingResponse,
  DisplayPricing,
  PaymentSuccessResult,
  BookingData,
  PaymentData,
  ServiceInfo,
  ServiceBookingPaymentProps,
} from './types'
